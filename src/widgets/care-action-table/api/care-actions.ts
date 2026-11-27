import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { careActionKeys, careActionStatusSchema } from '@/entities/care-action';
import { customerGradeSchema } from '@/entities/customer';
import { apiClient, decimalSchema } from '@/shared/api';

// 케어 조치 · 고객 엔티티를 함께 쓰는 응답이라 조회 함수는 위젯에 둔다(key 는 entities/care-action).
const careActionSchema = z.object({
  id: z.number(),
  transactionId: z.number(),
  customerId: z.number(),
  /** FDS_ADMIN 외에는 마스킹되어 온다. */
  customerName: z.string(),
  accountNumber: z.string(),
  customerGrade: customerGradeSchema,
  churnScore: decimalSchema,
  isFalsePositiveVictim: z.boolean(),
  recommendedProduct: z.string(),
  actionMessage: z.string(),
  status: careActionStatusSchema,
  sentBy: z.string().nullable(),
  /** 발송할 때 그대로 보내는 낙관적 잠금 버전. */
  version: z.number(),
});

export type CareAction = z.infer<typeof careActionSchema>;

/** 케어 조치 목록(최신순). FDS_ADMIN · CRM_MARKETER. */
export async function fetchCareActions() {
  const { data } = await apiClient.get('/api/care-actions');
  return z.object({ items: z.array(careActionSchema) }).parse(data).items;
}

export const careActionListQueryOptions = () =>
  queryOptions({ queryKey: careActionKeys.list(), queryFn: fetchCareActions });
