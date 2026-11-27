import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

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
    expect(cells.getByText('해외 · 기기 변경')).toBeInTheDocument();
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
