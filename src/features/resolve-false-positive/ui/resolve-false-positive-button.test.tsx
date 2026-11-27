import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { careActionKeys } from '@/entities/care-action';
import { customerKeys } from '@/entities/customer';
import { transactionKeys } from '@/entities/transaction';
import { renderWithProviders, server } from '@/shared/lib/test';

import { ResolveFalsePositiveButton } from './resolve-false-positive-button';

const API = 'http://localhost:8080';

const resolvedTx = {
  id: 7,
  customerId: 2,
  customerName: '이서연',
  accountNumber: '110-345-678902',
  amount: 5000000,
  txHour: 2,
  occurredAt: null,
  isOverseas: true,
  deviceChanged: false,
  fraudScore: 0.85,
  fdsStatus: 'BLOCKED',
  isActualFraud: false,
  shapReasons: [],
  churnScore: 0.7,
};

describe('ResolveFalsePositiveButton', () => {
  afterEach(() => vi.restoreAllMocks());

  it('확인하면 오탐 판정을 요청한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const requested = vi.fn();
    server.use(
      http.patch(`${API}/api/transactions/7/resolve-false-positive`, () => {
        requested();
        return HttpResponse.json(resolvedTx);
      }),
    );
    renderWithProviders(<ResolveFalsePositiveButton transactionId={7} />);

    await userEvent.setup().click(screen.getByRole('button', { name: '오탐 판정' }));

    await vi.waitFor(() => expect(requested).toHaveBeenCalledOnce());
    expect(window.confirm).toHaveBeenCalledWith('오탐(정상 거래)으로 판정할까요? (거래 #7)');
  });

  it('취소하면 요청하지 않는다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWithProviders(<ResolveFalsePositiveButton transactionId={7} />);

    // MSW 가 처리되지 않은 요청을 실패시키므로, 요청이 나가면 테스트가 깨진다.
    await userEvent.setup().click(screen.getByRole('button', { name: '오탐 판정' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('이미 판정된 거래면 서버 메시지를 보여준다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    server.use(
      http.patch(`${API}/api/transactions/7/resolve-false-positive`, () =>
        HttpResponse.json(
          {
            status: 409,
            detail: '이미 판정이 끝난 거래입니다.',
            code: 'TRANSACTION_ALREADY_JUDGED',
          },
          { status: 409 },
        ),
      ),
    );
    const { queryClient } = renderWithProviders(<ResolveFalsePositiveButton transactionId={7} />);
    queryClient.setQueryData(transactionKeys.list(), []);
    queryClient.setQueryData(customerKeys.highRisk(), []);
    queryClient.setQueryData(careActionKeys.list(), []);

    await userEvent.setup().click(screen.getByRole('button', { name: '오탐 판정' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 판정이 끝난 거래입니다.');
    // 목록이 오래됐다는 뜻이므로 실패해도 거래 · 고객 · 케어 조치 목록을 무효화한다.
    expect(queryClient.getQueryState(transactionKeys.list())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(customerKeys.highRisk())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(careActionKeys.list())?.isInvalidated).toBe(true);
  });
});
