import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type EmployeeRole, useSessionStore } from '@/entities/session';
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

describe('CareActionTable 발송 이력', () => {
  it('이력을 펼치면 발송 이력을 불러와 보여주고, 다시 누르면 접는다', async () => {
    mockCareActions([sentAction]);
    server.use(
      http.get(`${API}/api/care-actions/3/send-history`, () =>
        HttpResponse.json({
          items: [
            {
              id: 1,
              sentBy: 'crm_marketer',
              sentAt: '2026-11-25T09:30:00',
              recommendedProduct: '안심차단 서비스',
              actionMessage: '평소와 다른 거래가 감지되어 확인 중입니다.',
              careActionVersion: 1,
            },
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<CareActionTable />);

    await user.click(await screen.findByRole('button', { name: '케어 조치 #3 발송 이력 보기' }));

    const history = await screen.findByRole('region', { name: '케어 조치 #3 발송 이력' });
    expect(
      await within(history).findByText('2026.11.25 09:30 · crm_marketer · 버전 1'),
    ).toBeInTheDocument();
    expect(
      within(history).getByText('평소와 다른 거래가 감지되어 확인 중입니다.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '케어 조치 #3 발송 이력 접기' }));

    expect(
      screen.queryByRole('region', { name: '케어 조치 #3 발송 이력' }),
    ).not.toBeInTheDocument();
  });

  it('발송한 적이 없으면 안내한다', async () => {
    mockCareActions([pendingAction]);
    server.use(
      http.get(`${API}/api/care-actions/11/send-history`, () => HttpResponse.json({ items: [] })),
    );
    renderWithProviders(<CareActionTable />);

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: '케어 조치 #11 발송 이력 보기' }));

    expect(await screen.findByText('아직 발송한 적이 없습니다.')).toBeInTheDocument();
  });
});

describe('CareActionTable 발송', () => {
  afterEach(() => {
    useSessionStore.getState().clearSession();
    vi.restoreAllMocks();
  });

  const loginAs = (role: EmployeeRole) =>
    useSessionStore.getState().setSession({
      accessToken: 'token',
      username: 'tester',
      role,
      department: '테스트팀',
      expiresAt: null,
    });

  it('CRM 마케터에게는 발송 대기 조치에만 발송 버튼이 보인다', async () => {
    loginAs('CRM_MARKETER');
    mockCareActions([pendingAction, sentAction]);
    renderWithProviders(<CareActionTable />);
    await screen.findByText('최*아');

    expect(rowOf('최*아').getByRole('button', { name: '발송 처리' })).toBeInTheDocument();
    expect(rowOf('강*은').queryByRole('button', { name: '발송 처리' })).not.toBeInTheDocument();
  });

  it('FDS 관리자에게는 발송 버튼이 보이지 않는다', async () => {
    loginAs('FDS_ADMIN');
    mockCareActions([pendingAction]);
    renderWithProviders(<CareActionTable />);
    await screen.findByText('최*아');

    expect(screen.queryByRole('button', { name: '발송 처리' })).not.toBeInTheDocument();
  });

  it('발송하면 목록 위에 결과를 알린다', async () => {
    loginAs('CRM_MARKETER');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let body: unknown;
    let listRequests = 0;
    server.use(
      http.get(`${API}/api/care-actions`, () => {
        listRequests += 1;
        const item =
          listRequests === 1
            ? pendingAction
            : { ...pendingAction, status: 'SENT', sentBy: 'tester', version: 2 };
        return HttpResponse.json({ items: [item] });
      }),
      http.patch(`${API}/api/care-actions/11/send`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 11, status: 'SENT', version: 2 });
      }),
    );
    renderWithProviders(<CareActionTable />);

    await userEvent.setup().click(await screen.findByRole('button', { name: '발송 처리' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      '최*아 고객에게 케어 조치를 발송 처리했습니다.',
    );
    expect(body).toEqual({ version: 1 });
    expect(await screen.findByText('tester')).toBeInTheDocument();
  });
});
