import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { type EmployeeRole, useSessionStore } from '@/entities/session';
import { renderWithProviders, server } from '@/shared/lib/test';

import { TransactionTable } from './transaction-table';

const API = 'http://localhost:8080';

/** 백엔드 TransactionResponse 그대로의 JSON. */
const blockedTx = {
  id: 2,
  customerId: 1,
  customerName: '김*준',
  accountNumber: '110-***-***801',
  amount: 15000000,
  txHour: 3,
  occurredAt: '2026-11-27T03:12:00',
  isOverseas: true,
  deviceChanged: true,
  fraudScore: 0.95,
  fdsStatus: 'BLOCKED',
  isActualFraud: null,
  shapReasons: [
    { feature: 'amount_ratio', shap: 0.4 },
    { feature: 'device_changed', shap: 0.3 },
  ],
  churnScore: 0.42,
};

function mockTransactions(items: unknown[]) {
  server.use(http.get(`${API}/api/transactions`, () => HttpResponse.json({ items })));
}

describe('TransactionTable', () => {
  it('거래를 표로 보여준다', async () => {
    mockTransactions([blockedTx]);
    renderWithProviders(<TransactionTable />);

    const row = (await screen.findByText('김*준')).closest('tr');
    if (!row) throw new Error('행을 찾을 수 없습니다.');
    const cells = within(row);

    expect(cells.getByText('15,000,000원')).toBeInTheDocument();
    expect(cells.getByText('2026.11.27 03:12')).toBeInTheDocument();
    expect(cells.getByText('해외')).toBeInTheDocument();
    // 조건 배지와 탐지 근거(SHAP) 양쪽에 나온다.
    expect(cells.getAllByText('기기 변경')).toHaveLength(2);
    expect(cells.getByText('95.0%')).toBeInTheDocument();
    expect(cells.getByText('차단')).toBeInTheDocument();
    expect(cells.getByText('평소 대비 고액')).toBeInTheDocument();
    expect(cells.getByText('미판정')).toBeInTheDocument();
  });

  it('BigDecimal 이 문자열로 와도 표시한다', async () => {
    mockTransactions([{ ...blockedTx, amount: '2800000.00', fraudScore: '0.0820' }]);
    renderWithProviders(<TransactionTable />);

    expect(await screen.findByText('2,800,000원')).toBeInTheDocument();
    expect(screen.getByText('8.2%')).toBeInTheDocument();
  });

  it('거래가 없으면 빈 상태를 보여준다', async () => {
    mockTransactions([]);
    renderWithProviders(<TransactionTable />);

    expect(await screen.findByText('거래 내역이 없습니다.')).toBeInTheDocument();
  });

  describe('오탐 판정 버튼', () => {
    afterEach(() => useSessionStore.getState().clearSession());

    const loginAs = (role: EmployeeRole) =>
      useSessionStore.getState().setSession({
        accessToken: 'token',
        username: 'tester',
        role,
        department: '테스트팀',
        expiresAt: null,
      });

    it('FDS_ADMIN 에게 차단된 미판정 거래에만 보인다', async () => {
      loginAs('FDS_ADMIN');
      mockTransactions([
        blockedTx,
        { ...blockedTx, id: 3, customerName: '판정 끝', isActualFraud: false },
        { ...blockedTx, id: 4, customerName: '정상 거래', fdsStatus: 'NORMAL' },
      ]);
      renderWithProviders(<TransactionTable />);

      await screen.findByText('김*준');
      expect(screen.getAllByRole('button', { name: '오탐 판정' })).toHaveLength(1);
      expect(screen.getByText('오탐')).toBeInTheDocument();
    });

    it('CRM_MARKETER 에게는 보이지 않는다', async () => {
      loginAs('CRM_MARKETER');
      mockTransactions([blockedTx]);
      renderWithProviders(<TransactionTable />);

      await screen.findByText('김*준');
      expect(screen.queryByRole('button', { name: '오탐 판정' })).not.toBeInTheDocument();
      expect(screen.getByText('미판정')).toBeInTheDocument();
    });
  });

  it('조회에 실패하면 에러를 보여준다', async () => {
    server.use(
      http.get(`${API}/api/transactions`, () =>
        HttpResponse.json({ status: 403, detail: '접근 권한이 없습니다.' }, { status: 403 }),
      ),
    );
    renderWithProviders(<TransactionTable />);

    expect(await screen.findByRole('alert')).toHaveTextContent('접근 권한이 없습니다.');
  });
});

describe('TransactionTable 필터 · 검색', () => {
  const normalTx = {
    ...blockedTx,
    id: 9,
    customerName: '박*훈',
    accountNumber: '110-***-***003',
    fdsStatus: 'NORMAL',
    fraudScore: 0.05,
    isOverseas: false,
    deviceChanged: false,
    shapReasons: [],
  };

  it('상태 필터를 고르면 해당 거래만 보여주고, 필터마다 건수를 보여준다', async () => {
    mockTransactions([blockedTx, normalTx]);
    renderWithProviders(<TransactionTable />);
    await screen.findByText('김*준');

    const filters = within(screen.getByRole('group', { name: '거래 필터' }));
    expect(filters.getByRole('button', { name: '판정 대기 1건' })).toBeInTheDocument();

    await userEvent.setup().click(filters.getByRole('button', { name: '정상 1건' }));

    expect(screen.queryByText('김*준')).not.toBeInTheDocument();
    expect(screen.getByText('박*훈')).toBeInTheDocument();
  });

  it('고객 이름으로 검색한다', async () => {
    mockTransactions([blockedTx, normalTx]);
    renderWithProviders(<TransactionTable />);
    await screen.findByText('김*준');

    await userEvent.setup().type(screen.getByRole('searchbox', { name: '거래 검색' }), '박');

    expect(screen.queryByText('김*준')).not.toBeInTheDocument();
    expect(screen.getByText('박*훈')).toBeInTheDocument();
  });

  it('조건에 맞는 거래가 없으면 안내한다', async () => {
    mockTransactions([blockedTx]);
    renderWithProviders(<TransactionTable />);
    await screen.findByText('김*준');

    await userEvent.setup().type(screen.getByRole('searchbox', { name: '거래 검색' }), '없는고객');

    expect(screen.getByText('조건에 맞는 거래가 없습니다.')).toBeInTheDocument();
  });
});
