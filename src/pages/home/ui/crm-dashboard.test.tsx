import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders, server } from '@/shared/lib/test';

import { CrmDashboard } from './crm-dashboard';

const API = 'http://localhost:8080';

const victim = {
  customerId: 4,
  name: '최수아',
  accountNumber: '110-567-890104',
  grade: 'GOLD',
  churnScore: 0.8346,
  isFalsePositiveVictim: true,
  riskReasons: ['FALSE_POSITIVE_VICTIM', 'HIGH_CHURN_SCORE'],
  churnReasons: [],
  pendingCareActions: [],
};

const pendingAction = {
  id: 11,
  transactionId: 5,
  customerId: 4,
  customerName: '최*아',
  accountNumber: '110-***-***104',
  customerGrade: 'GOLD',
  churnScore: 0.8346,
  isFalsePositiveVictim: true,
  recommendedProduct: '우대금리 파킹통장 + 수수료 면제 쿠폰',
  actionMessage: '정상 거래가 잘못 차단되어 불편을 드렸습니다.',
  status: 'PENDING',
  sentBy: null,
  version: 1,
};

function mockApis({
  customers = [victim],
  careActions = [pendingAction, { ...pendingAction, id: 3, status: 'SENT', sentBy: 'crm' }],
}: { customers?: unknown[]; careActions?: unknown[] } = {}) {
  server.use(
    http.get(`${API}/api/crm/high-risk-customers`, () => HttpResponse.json({ items: customers })),
    http.get(`${API}/api/care-actions`, () => HttpResponse.json({ items: careActions })),
  );
}

describe('CrmDashboard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('요약 수치 · 이탈 위험 상위 고객 · 발송 대기 케어 조치를 보여준다', async () => {
    mockApis();
    renderWithProviders(<CrmDashboard />);

    const top = within(await screen.findByRole('region', { name: '이탈 위험 상위 고객' }));
    expect(await top.findByText('최수아')).toBeInTheDocument();
    expect(top.getByText('오탐 피해')).toBeInTheDocument();
    expect(top.getByText('83.5%')).toBeInTheDocument();

    const pending = within(screen.getByRole('region', { name: '발송 대기 케어 조치' }));
    expect(await pending.findByText('최*아')).toBeInTheDocument();
    expect(pending.getAllByRole('button', { name: '발송 처리' })).toHaveLength(1);

    const stats = within(screen.getByLabelText('CRM 요약'));
    expect(stats.getByText('발송 대기 케어 조치').nextSibling).toHaveTextContent('1');
    expect(stats.getByText('발송 완료 케어 조치').nextSibling).toHaveTextContent('1');
  });

  it('대시보드에서 바로 발송하고 결과를 알린다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockApis();
    server.use(
      http.patch(`${API}/api/care-actions/11/send`, () =>
        HttpResponse.json({ id: 11, status: 'SENT', version: 2 }),
      ),
    );
    renderWithProviders(<CrmDashboard />);

    const pending = within(await screen.findByRole('region', { name: '발송 대기 케어 조치' }));
    await userEvent.setup().click(await pending.findByRole('button', { name: '발송 처리' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      '최*아 고객에게 케어 조치를 발송 처리했습니다.',
    );
  });

  it('할 일이 없으면 안내한다', async () => {
    mockApis({ customers: [], careActions: [] });
    renderWithProviders(<CrmDashboard />);

    expect(await screen.findByText('이탈 위험 고객이 없습니다.')).toBeInTheDocument();
    expect(await screen.findByText('발송할 케어 조치가 없습니다. 🎉')).toBeInTheDocument();
  });
});
