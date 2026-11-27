import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, server } from '@/shared/lib/test';

import { CareActionTable } from './care-action-table';

const API = 'http://localhost:8080';

/** 백엔드 CareActionResponse 그대로의 JSON. */
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

const sentAction = {
  ...pendingAction,
  id: 3,
  transactionId: 2,
  customerId: 6,
  customerName: '강*은',
  accountNumber: '110-***-***306',
  customerGrade: 'GENERAL',
  churnScore: 0.41,
  isFalsePositiveVictim: false,
  recommendedProduct: '안심차단 서비스',
  status: 'SENT',
  sentBy: 'crm_marketer',
  version: 2,
};

function mockCareActions(items: unknown[]) {
  server.use(http.get(`${API}/api/care-actions`, () => HttpResponse.json({ items })));
}

function rowOf(text: string) {
  const row = screen.getByText(text).closest('tr');
  if (!row) throw new Error(`${text} 행을 찾을 수 없습니다.`);
  return within(row);
}

describe('CareActionTable', () => {
  it('케어 조치를 표로 보여준다', async () => {
    mockCareActions([pendingAction, sentAction]);
    renderWithProviders(<CareActionTable />);
    await screen.findByText('최*아');

    const pending = rowOf('최*아');
    expect(pending.getByText('#11')).toBeInTheDocument();
    expect(pending.getByText('거래 #5')).toBeInTheDocument();
    expect(pending.getByText('GOLD')).toBeInTheDocument();
    expect(pending.getByText('오탐 피해')).toBeInTheDocument();
    expect(pending.getByText('83.5%')).toBeInTheDocument();
    expect(pending.getByText('우대금리 파킹통장 + 수수료 면제 쿠폰')).toBeInTheDocument();
    expect(pending.getByText('발송 대기')).toBeInTheDocument();

    const sent = rowOf('강*은');
    expect(sent.getByText('발송 완료')).toBeInTheDocument();
    expect(sent.getByText('crm_marketer')).toBeInTheDocument();
  });

  it('상태 필터와 검색으로 거른다', async () => {
    mockCareActions([pendingAction, sentAction]);
    const user = userEvent.setup();
    renderWithProviders(<CareActionTable />);
    await screen.findByText('최*아');

    const filters = within(screen.getByRole('group', { name: '케어 조치 필터' }));
    await user.click(filters.getByRole('button', { name: '발송 완료 1건' }));

    expect(screen.queryByText('최*아')).not.toBeInTheDocument();
    expect(screen.getByText('강*은')).toBeInTheDocument();

    await user.click(filters.getByRole('button', { name: '전체 2건' }));
    await user.type(screen.getByRole('searchbox', { name: '케어 조치 검색' }), '파킹통장');

    expect(screen.getByText('최*아')).toBeInTheDocument();
    expect(screen.queryByText('강*은')).not.toBeInTheDocument();
  });

  it('케어 조치가 없으면 빈 상태를 보여준다', async () => {
    mockCareActions([]);
    renderWithProviders(<CareActionTable />);

    expect(await screen.findByText('케어 조치가 없습니다.')).toBeInTheDocument();
  });

  it('조회에 실패하면 에러를 보여준다', async () => {
    server.use(
      http.get(`${API}/api/care-actions`, () =>
        HttpResponse.json({ status: 500, detail: '서버 오류가 발생했습니다.' }, { status: 500 }),
      ),
    );
    renderWithProviders(<CareActionTable />);

    expect(await screen.findByRole('alert')).toHaveTextContent('서버 오류가 발생했습니다.');
  });
});
