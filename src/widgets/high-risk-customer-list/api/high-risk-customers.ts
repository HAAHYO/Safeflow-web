import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import {
  churnReasonSchema,
  customerGradeSchema,
  customerKeys,
  highRiskReasonSchema,
} from '@/entities/customer';
import { fdsStatusSchema } from '@/entities/transaction';
import { apiClient, decimalSchema } from '@/shared/api';

const pendingCareActionSchema = z.object({
  id: z.number(),
  /** 발송할 때 그대로 보내는 낙관적 잠금 버전. */
  version: z.number(),
  transactionId: z.number(),
  fdsStatus: fdsStatusSchema,
  isFalsePositive: z.boolean(),
  recommendedProduct: z.string(),
  actionMessage: z.string(),
});

export type PendingCareAction = z.infer<typeof pendingCareActionSchema>;

const highRiskCustomerSchema = z.object({
  customerId: z.number(),
  /** 케어 발송용이라 원본(마스킹 없음)으로 온다. */
  name: z.string(),
  accountNumber: z.string(),
  grade: customerGradeSchema,
  churnScore: decimalSchema,
  isFalsePositiveVictim: z.boolean(),
  riskReasons: z.array(highRiskReasonSchema),
  churnReasons: z.array(churnReasonSchema),
  pendingCareActions: z.array(pendingCareActionSchema),
});

export type HighRiskCustomer = z.infer<typeof highRiskCustomerSchema>;

/** 이탈 고위험 고객(이탈 점수 내림차순). CRM_MARKETER 전용. */
export async function fetchHighRiskCustomers() {
  const { data } = await apiClient.get('/api/crm/high-risk-customers');
  return z.object({ items: z.array(highRiskCustomerSchema) }).parse(data).items;
}

export const highRiskCustomersQueryOptions = () =>
  queryOptions({ queryKey: customerKeys.highRisk(), queryFn: fetchHighRiskCustomers });
