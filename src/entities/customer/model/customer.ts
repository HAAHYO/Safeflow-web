import { z } from 'zod';

import { decimalSchema } from '@/shared/api';

export const customerGradeSchema = z.enum(['VIP', 'GOLD', 'GENERAL']);

export type CustomerGrade = z.infer<typeof customerGradeSchema>;

export const CUSTOMER_GRADE_LABEL: Record<CustomerGrade, string> = {
  VIP: 'VIP',
  GOLD: 'GOLD',
  GENERAL: '일반',
};

/** 고위험으로 분류된 이유. 백엔드 기준: 오탐 피해 고객이거나 이탈 점수 0.60 이상. */
export const highRiskReasonSchema = z.enum(['FALSE_POSITIVE_VICTIM', 'HIGH_CHURN_SCORE']);

export type HighRiskReason = z.infer<typeof highRiskReasonSchema>;

export const HIGH_RISK_REASON_LABEL: Record<HighRiskReason, string> = {
  FALSE_POSITIVE_VICTIM: '오탐 피해',
  HIGH_CHURN_SCORE: '이탈 점수 높음',
};

/** 이탈 점수에 대한 피처 기여도(Shapley). 백엔드가 양수 기여만 큰 순으로 최대 3개 보낸다. */
export const churnReasonSchema = z.object({
  feature: z.string(),
  contribution: decimalSchema,
});

export type ChurnReason = z.infer<typeof churnReasonSchema>;

/** 백엔드 이탈 모델의 피처 이름 → 화면 문구. 모르는 피처는 이름을 그대로 보여준다. */
const CHURN_FEATURE_LABEL: Record<string, string> = {
  recent_false_positive_count: '최근 오탐 차단',
  false_positive_victim: '오탐 피해 이력',
  recent_blocked_count: '최근 차단 거래',
  recent_warning_count: '최근 주의 거래',
  card_usage_change_rate: '카드 사용 감소',
  login_freq_change_rate: '로그인 빈도 감소',
  app_login_freq: '앱 로그인 적음',
  vip_grade: 'VIP 등급',
};

export function getChurnFeatureLabel(feature: string): string {
  return CHURN_FEATURE_LABEL[feature] ?? feature;
}
