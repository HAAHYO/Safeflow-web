import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { careActionKeys } from '@/entities/care-action';
import { customerKeys } from '@/entities/customer';
import { renderWithProviders, server } from '@/shared/lib/test';

import { SendCareActionButton } from './send-care-action-button';

const API = 'http://localhost:8080';

const sentCareAction = {
  id: 11,
  transactionId: 5,
  customerId: 2,
  customerName: '이서연',
  accountNumber: '110-345-678902',
  customerGrade: 'VIP',
  churnScore: 0.78,
  isFalsePositiveVictim: true,
  recommendedProduct: '수수료 면제 + VIP 전담 상담',
  actionMessage: '정상 거래가 잘못 차단되어 큰 불편을 드렸습니다.',
  status: 'SENT',
  sentBy: 'crm_marketer',
  version: 2,
};

function renderButton() {
  const result = renderWithProviders(
    <SendCareActionButton careActionId={11} version={1} customerName="이서연" />,
  );
  result.queryClient.setQueryData(customerKeys.highRisk(), []);
  result.queryClient.setQueryData(careActionKeys.list(), []);
  return result;
}

describe('SendCareActionButton', () => {
  afterEach(() => vi.restoreAllMocks());

  it('확인하면 조회한 version 으로 발송을 요청하고 관련 목록을 무효화한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let body: unknown;
    server.use(
      http.patch(`${API}/api/care-actions/11/send`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(sentCareAction);
      }),
    );
    const { queryClient } = renderButton();

    await userEvent.setup().click(screen.getByRole('button', { name: '발송 처리' }));

    await vi.waitFor(() => expect(body).toEqual({ version: 1 }));
    expect(window.confirm).toHaveBeenCalledWith('이서연 고객에게 케어 조치를 발송 처리할까요?');
    await vi.waitFor(() =>
      expect(queryClient.getQueryState(customerKeys.highRisk())?.isInvalidated).toBe(true),
    );
    expect(queryClient.getQueryState(careActionKeys.list())?.isInvalidated).toBe(true);
  });

  it('취소하면 요청하지 않는다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderButton();

    // MSW 가 처리되지 않은 요청을 실패시키므로, 요청이 나가면 테스트가 깨진다.
    await userEvent.setup().click(screen.getByRole('button', { name: '발송 처리' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('내용이 바뀌었으면(STALE) 서버 메시지를 보여주고 목록을 다시 불러온다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    server.use(
      http.patch(`${API}/api/care-actions/11/send`, () =>
        HttpResponse.json(
          {
            status: 409,
            detail: '케어 조치 내용이 변경되었습니다. 다시 확인한 뒤 발송해 주세요.',
            code: 'CARE_ACTION_STALE',
          },
          { status: 409 },
        ),
      ),
    );
    const { queryClient } = renderButton();

    await userEvent.setup().click(screen.getByRole('button', { name: '발송 처리' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '케어 조치 내용이 변경되었습니다. 다시 확인한 뒤 발송해 주세요.',
    );
    expect(queryClient.getQueryState(customerKeys.highRisk())?.isInvalidated).toBe(true);
  });
});
