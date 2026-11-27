import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { renderWithProviders, server } from '@/shared/lib/test';

import { SimulateTransactionForm } from './simulate-transaction-form';

const API = 'http://localhost:8080';

const blockedResult = {
  transactionId: 21,
  customerId: 3,
  amount: 15000000,
  txHour: 3,
  occurredAt: '2026-11-27T03:00:00',
  fraudScore: 0.95,
  fdsStatus: 'BLOCKED',
  shapReasons: [{ feature: 'is_overseas', shap: 0.25 }],
  balanceAfter: 45200000,
  churnScore: 0.61,
  careActionCreated: true,
};

describe('SimulateTransactionForm', () => {
  let transactionListRequests = 0;

  beforeEach(() => {
    transactionListRequests = 0;
    server.use(
      http.get(`${API}/api/transactions`, () => {
        transactionListRequests += 1;
        return HttpResponse.json({ items: [] });
      }),
    );
  });

  it('입력값을 요청으로 보내고 FDS 분석 결과를 보여준다', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/api/transactions/simulate`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(blockedResult, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<SimulateTransactionForm />);

    await user.type(screen.getByLabelText('고객 ID'), '3');
    await user.type(screen.getByLabelText('금액(원)'), '15,000,000');
    await user.type(screen.getByLabelText('발생 시각 (비우면 현재 시각)'), '2026-11-27T03:00');
    await user.click(screen.getByLabelText('해외 거래'));
    await user.click(screen.getByRole('button', { name: '거래 발생시키기' }));

    const result = await screen.findByRole('region', { name: '시뮬레이션 결과' });
    expect(body).toEqual({
      customerId: 3,
      amount: 15000000,
      isOverseas: true,
      deviceChanged: false,
      occurredAt: '2026-11-27T03:00:00+09:00',
    });
    expect(result).toHaveTextContent('거래 #21');
    expect(result).toHaveTextContent('차단');
    expect(result).toHaveTextContent('95.0%');
    expect(result).toHaveTextContent('차단된 거래라 잔액이 차감되지 않았습니다.');
    expect(result).toHaveTextContent('고객 케어 조치가 생성되었습니다.');
    // 성공하면 거래 목록을 다시 불러온다.
    await expect.poll(() => transactionListRequests).toBe(2);
  });

  it('발생 시각을 비우면 보내지 않는다', async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${API}/api/transactions/simulate`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...blockedResult, fdsStatus: 'NORMAL' }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<SimulateTransactionForm />);

    await user.type(screen.getByLabelText('고객 ID'), '3');
    await user.type(screen.getByLabelText('금액(원)'), '1000');
    await user.click(screen.getByRole('button', { name: '거래 발생시키기' }));

    await screen.findByRole('region', { name: '시뮬레이션 결과' });
    expect(body).not.toHaveProperty('occurredAt');
  });

  it('서버 에러(잔액 부족 등)를 보여준다', async () => {
    server.use(
      http.post(`${API}/api/transactions/simulate`, () =>
        HttpResponse.json(
          { status: 409, detail: '잔액이 부족합니다.', code: 'INSUFFICIENT_BALANCE' },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<SimulateTransactionForm />);

    await user.type(screen.getByLabelText('고객 ID'), '9');
    await user.type(screen.getByLabelText('금액(원)'), '999999999');
    await user.click(screen.getByRole('button', { name: '거래 발생시키기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('잔액이 부족합니다.');
  });

  it('잘못된 입력이면 요청하지 않는다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SimulateTransactionForm />);

    await user.type(screen.getByLabelText('금액(원)'), '12.5');
    await user.click(screen.getByRole('button', { name: '거래 발생시키기' }));

    expect(await screen.findByText('고객 ID 를 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('1원 이상의 정수 금액을 입력해 주세요.')).toBeInTheDocument();
  });
});
