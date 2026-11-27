import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient, localDateTimeSchema } from '@/shared/api';

import { careActionKeys } from './care-action-keys';

const sendHistorySchema = z.object({
  id: z.number(),
  sentBy: z.string(),
  sentAt: localDateTimeSchema,
  /** 발송 당시의 상품 · 문구. 이후 오탐 판정으로 조치가 바뀌어도 이력은 그대로 남는다. */
  recommendedProduct: z.string(),
  actionMessage: z.string(),
  careActionVersion: z.number(),
});

export type SendHistory = z.infer<typeof sendHistorySchema>;

/** 케어 조치 발송 이력(최신순). */
export async function fetchSendHistory(careActionId: number) {
  const { data } = await apiClient.get(`/api/care-actions/${careActionId}/send-history`);
  return z.object({ items: z.array(sendHistorySchema) }).parse(data).items;
}

export const sendHistoryQueryOptions = (careActionId: number) =>
  queryOptions({
    queryKey: careActionKeys.sendHistory(careActionId),
    queryFn: () => fetchSendHistory(careActionId),
  });
