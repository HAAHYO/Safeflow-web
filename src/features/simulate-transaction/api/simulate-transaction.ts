import { z } from 'zod';

import { fdsStatusSchema, shapReasonSchema } from '@/entities/transaction';
import { apiClient, decimalSchema, localDateTimeSchema } from '@/shared/api';

export type SimulateTransactionRequest = {
  customerId: number;
  amount: number;
  isOverseas: boolean;
  deviceChanged: boolean;
  /** ISO-8601 + 오프셋. 생략하면 서버 현재 시각. */
  occurredAt?: string;
};

export const simulateTransactionResponseSchema = z.object({
  transactionId: z.number(),
  customerId: z.number(),
  amount: decimalSchema,
  txHour: z.number(),
  occurredAt: localDateTimeSchema.nullable(),
  fraudScore: decimalSchema,
  fdsStatus: fdsStatusSchema,
  shapReasons: z.array(shapReasonSchema),
  balanceAfter: decimalSchema,
  churnScore: decimalSchema,
  careActionCreated: z.boolean(),
});

export type SimulateTransactionResponse = z.infer<typeof simulateTransactionResponseSchema>;

/** FDS 스코어링 후 상태에 따라 잔액 차감 · 이탈 점수 갱신 · 케어 조치 생성까지 서버가 처리한다. */
export async function simulateTransaction(request: SimulateTransactionRequest) {
  const { data } = await apiClient.post('/api/transactions/simulate', request);
  return simulateTransactionResponseSchema.parse(data);
}
