import { beforeEach, describe, expect, it } from 'vitest';

import { server } from '@/shared/lib/test';

import { resetMockDb } from './db';
import { handlers } from './handlers';

const API = 'http://localhost:8080';

type Json = Record<string, unknown> & { items?: Record<string, unknown>[] };

async function call(
  method: string,
  path: string,
  { token, body }: { token?: string; body?: unknown } = {},
) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, json: (await response.json()) as Json };
}

async function login(username: 'fds_admin' | 'crm_marketer') {
  const { json } = await call('POST', '/api/auth/login', { body: { username, password: 'any' } });
  return json.accessToken as string;
}

describe('목 모드 API', () => {
  beforeEach(() => {
    resetMockDb();
    server.use(...handlers);
  });

  it('시드 계정으로만 로그인된다', async () => {
    const ok = await call('POST', '/api/auth/login', {
      body: { username: 'crm_marketer', password: 'x' },
    });
    const fail = await call('POST', '/api/auth/login', {
      body: { username: 'nobody', password: 'x' },
    });

    expect(ok.json).toMatchObject({ role: 'CRM_MARKETER', department: '고객관리팀' });
    expect(fail.status).toBe(401);
    expect(fail.json.code).toBe('INVALID_CREDENTIALS');
  });

  it('토큰이 없으면 401, 역할이 다르면 403', async () => {
    const crm = await login('crm_marketer');

    expect((await call('GET', '/api/transactions')).status).toBe(401);
    expect(
      (await call('PATCH', '/api/transactions/10/resolve-false-positive', { token: crm })).status,
    ).toBe(403);
  });

  it('FDS_ADMIN 외에는 고객 이름 · 계좌를 마스킹한다', async () => {
    const admin = await call('GET', '/api/transactions', { token: await login('fds_admin') });
    const crm = await call('GET', '/api/transactions', { token: await login('crm_marketer') });

    expect(admin.json.items?.[0]).toMatchObject({ customerName: '박지훈' });
    expect(crm.json.items?.[0]).toMatchObject({
      customerName: '박*훈',
      accountNumber: '110-***-***003',
    });
  });

  it('차단된 시뮬레이션 거래는 잔액을 깎지 않고 케어 조치를 만든다', async () => {
    const token = await login('fds_admin');

    const { status, json } = await call('POST', '/api/transactions/simulate', {
      token,
      body: {
        customerId: 5,
        amount: 3_000_000,
        isOverseas: true,
        deviceChanged: true,
        occurredAt: '2026-11-27T03:00:00+09:00',
      },
    });

    expect(status).toBe(201);
    expect(json).toMatchObject({
      fdsStatus: 'BLOCKED',
      balanceAfter: 27_450_000,
      careActionCreated: true,
    });
  });

  it('발생 시각 형식이 틀리면 400 으로 거절하고 저장하지 않는다', async () => {
    const token = await login('fds_admin');

    const { status, json } = await call('POST', '/api/transactions/simulate', {
      token,
      body: { customerId: 5, amount: 1000, occurredAt: '2026-11-27 03:00' },
    });
    const list = await call('GET', '/api/transactions', { token });

    expect(status).toBe(400);
    expect(json.code).toBe('INVALID_INPUT');
    expect(list.json.items).toHaveLength(12);
  });

  it('오탐 판정하면 고객이 이탈 위험 목록에 오르고, 케어 조치 version 이 올라간다', async () => {
    const admin = await login('fds_admin');
    const crm = await login('crm_marketer');
    // 시드 거래 #10: 김민준 고객의 차단 · 미판정 거래
    const before = await call('GET', '/api/crm/high-risk-customers', { token: crm });
    expect(before.json.items?.some((c) => c.name === '김민준')).toBe(false);

    const resolved = await call('PATCH', '/api/transactions/10/resolve-false-positive', {
      token: admin,
    });
    const again = await call('PATCH', '/api/transactions/10/resolve-false-positive', {
      token: admin,
    });
    const after = await call('GET', '/api/crm/high-risk-customers', { token: crm });

    expect(resolved.json.isActualFraud).toBe(false);
    expect(again.json.code).toBe('TRANSACTION_ALREADY_JUDGED');
    const victim = after.json.items?.find((c) => c.name === '김민준');
    expect(victim?.riskReasons).toContain('FALSE_POSITIVE_VICTIM');
    expect(victim?.pendingCareActions).toEqual([
      expect.objectContaining({ version: 1, recommendedProduct: '수수료 면제 + VIP 전담 상담' }),
    ]);
  });

  it('케어 조치는 최신 version 일 때만 발송되고 이력이 남는다', async () => {
    const crm = await login('crm_marketer');
    const { json } = await call('GET', '/api/crm/high-risk-customers', { token: crm });
    const action = (json.items?.[0]?.pendingCareActions as { id: number; version: number }[])[0];
    if (!action) throw new Error('대기 케어 조치가 없습니다.');

    const stale = await call('PATCH', `/api/care-actions/${action.id}/send`, {
      token: crm,
      body: { version: action.version + 1 },
    });
    const sent = await call('PATCH', `/api/care-actions/${action.id}/send`, {
      token: crm,
      body: { version: action.version },
    });
    const twice = await call('PATCH', `/api/care-actions/${action.id}/send`, {
      token: crm,
      body: { version: action.version + 1 },
    });
    const history = await call('GET', `/api/care-actions/${action.id}/send-history`, {
      token: crm,
    });

    expect(stale.json.code).toBe('CARE_ACTION_STALE');
    expect(sent.json).toMatchObject({ status: 'SENT', sentBy: 'crm_marketer' });
    expect(twice.json.code).toBe('CARE_ACTION_ALREADY_SENT');
    expect(history.json.items).toEqual([
      expect.objectContaining({ sentBy: 'crm_marketer', careActionVersion: action.version }),
    ]);
  });
});
