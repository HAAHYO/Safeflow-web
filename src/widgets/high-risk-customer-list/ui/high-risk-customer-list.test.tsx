import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, server } from '@/shared/lib/test';

import { HighRiskCustomerList } from './high-risk-customer-list';

const API = 'http://localhost:8080';

/** 백엔드 HighRiskCustomerResponse 그대로의 JSON. */
const victim = {
  customerId: 2,
  name: '이서연',
  accountNumber: '110-345-678902',
  grade: 'VIP',
  churnScore: 0.7821,
  isFalsePositiveVictim: true,
  riskReasons: ['FALSE_POSITIVE_VICTIM', 'HIGH_CHURN_SCORE'],
  churnReasons: [
    { feature: 'recent_false_positive_count', contribution: 0.21 },
    { feature: 'card_usage_change_rate', contribution: 0.15 },
  ],
  pendingCareActions: [
    {
      id: 11,
      version: 1,
      transactionId: 5,
      fdsStatus: 'BLOCKED',
      isFalsePositive: true,
      recommendedProduct: '수수료 면제 + VIP 전담 상담',
      actionMessage: '정상 거래가 잘못 차단되어 큰 불편을 드렸습니다.',
    },
  ],
};

function mockHighRisk(items: unknown[]) {
  server.use(http.get(`${API}/api/crm/high-risk-customers`, () => HttpResponse.json({ items })));
}

describe('HighRiskCustomerList', () => {
  it('고객별 이탈 점수 · 위험 사유 · 이탈 요인 · 대기 케어 조치를 보여준다', async () => {
    mockHighRisk([victim]);
    renderWithProviders(<HighRiskCustomerList />);

    const card = within(await screen.findByRole('listitem', { name: '이서연 고객' }));

    expect(card.getByText('110-345-678902')).toBeInTheDocument();
    expect(card.getByText('VIP')).toBeInTheDocument();
    expect(card.getByText('78.2%')).toBeInTheDocument();
    expect(card.getByText('오탐 피해')).toBeInTheDocument();
    expect(card.getByText('이탈 점수 높음')).toBeInTheDocument();
    expect(card.getByText('최근 오탐 차단')).toBeInTheDocument();
    expect(card.getByText('카드 사용 감소')).toBeInTheDocument();
    expect(card.getByText('대기 중인 케어 조치 1건')).toBeInTheDocument();
    expect(card.getByText('수수료 면제 + VIP 전담 상담')).toBeInTheDocument();
    expect(card.getByText('오탐 판정')).toBeInTheDocument();
  });

  it('대기 중인 케어 조치가 없으면 안내 문구를 보여준다', async () => {
    mockHighRisk([{ ...victim, pendingCareActions: [] }]);
    renderWithProviders(<HighRiskCustomerList />);

    expect(await screen.findByText('대기 중인 케어 조치가 없습니다.')).toBeInTheDocument();
  });

  it('고위험 고객이 없으면 빈 상태를 보여준다', async () => {
    mockHighRisk([]);
    renderWithProviders(<HighRiskCustomerList />);

    expect(await screen.findByText('이탈 위험 고객이 없습니다.')).toBeInTheDocument();
  });

  it('권한이 없으면(403) 서버 메시지를 보여준다', async () => {
    server.use(
      http.get(`${API}/api/crm/high-risk-customers`, () =>
        HttpResponse.json({ status: 403, detail: '접근 권한이 없습니다.' }, { status: 403 }),
      ),
    );
    renderWithProviders(<HighRiskCustomerList />);

    expect(await screen.findByRole('alert')).toHaveTextContent('접근 권한이 없습니다.');
  });
});
