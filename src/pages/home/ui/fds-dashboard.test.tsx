import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, server } from '@/shared/lib/test';

import { FdsDashboard } from './fds-dashboard';

const API = 'http://localhost:8080';

const base = {
  customerId: 1,
  customerName: '김민준',
  accountNumber: '110-234-567801',
  amount: 15000000,
  txHour: 3,
  occurredAt: '2026-11-26T03:12:00',
  isOverseas: true,
  deviceChanged: true,
  fraudScore: 0.95,
  fdsStatus: 'BLOCKED',
  isActualFraud: null,
  shapReasons: [],
  churnScore: 0.18,
};

function mockTransactions(items: unknown[]) {
  server.use(http.get(`${API}/api/transactions`, () => HttpResponse.json({ items })));
}

describe('FdsDashboard', () => {
  it('판정 대기 거래를 판정 버튼과 함께 보여준다', async () => {
    mockTransactions([
      { ...base, id: 10 },
      { ...base, id: 3, isActualFraud: false },
      { ...base, id: 1, fdsStatus: 'NORMAL', fraudScore: 0.08 },
    ]);
    renderWithProviders(<FdsDashboard />);

    const panel = within(await screen.findByRole('region', { name: '오탐 판정 대기' }));
    expect(panel.getByText('차단됐지만 아직 판정하지 않은 거래 1건')).toBeInTheDocument();
    expect(panel.getByText(/#10 김민준/)).toBeInTheDocument();
    expect(panel.getByText('15,000,000원 · 사기 점수 95.0%')).toBeInTheDocument();
    expect(panel.getAllByRole('button', { name: '오탐 판정' })).toHaveLength(1);
  });

  it('탐지 현황을 건수와 비율로 보여준다', async () => {
    mockTransactions([
      { ...base, id: 10 },
      { ...base, id: 3, isActualFraud: false },
      { ...base, id: 1, fdsStatus: 'NORMAL', fraudScore: 0.08 },
      { ...base, id: 2, fdsStatus: 'NORMAL', fraudScore: 0.1 },
    ]);
    renderWithProviders(<FdsDashboard />);

    const status = within(await screen.findByRole('list', { name: 'FDS 상태 분포' }));
    // 정상 2 · 주의 0 · 차단 2
    expect(status.getByText('정상')).toHaveTextContent('정상2건 (50%)');
    expect(status.getByText('주의')).toHaveTextContent('주의0건 (0%)');
    expect(status.getByText('차단')).toHaveTextContent('차단2건 (50%)');
    const judgement = within(screen.getByRole('list', { name: '차단 거래 판정 결과' }));
    expect(judgement.getAllByText('1건 (50%)')).toHaveLength(2);
  });

  it('판정할 거래가 없으면 안내한다', async () => {
    mockTransactions([{ ...base, id: 1, fdsStatus: 'NORMAL', fraudScore: 0.08 }]);
    renderWithProviders(<FdsDashboard />);

    expect(await screen.findByText('판정할 거래가 없습니다. 🎉')).toBeInTheDocument();
  });
});
