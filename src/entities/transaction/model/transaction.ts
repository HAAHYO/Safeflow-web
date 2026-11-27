import { z } from 'zod';

import { decimalSchema, localDateTimeSchema } from '@/shared/api';

export const fdsStatusSchema = z.enum(['NORMAL', 'WARNING', 'BLOCKED']);

export type FdsStatus = z.infer<typeof fdsStatusSchema>;

export const FDS_STATUS_LABEL: Record<FdsStatus, string> = {
  NORMAL: '정상',
  WARNING: '주의',
  BLOCKED: '차단',
};

export const shapReasonSchema = z.object({
  feature: z.string(),
  shap: decimalSchema,
});

export type ShapReason = z.infer<typeof shapReasonSchema>;

/** 백엔드 FDS 엔진의 피처 이름 → 화면 문구. 모르는 피처는 이름을 그대로 보여준다. */
const SHAP_FEATURE_LABEL: Record<string, string> = {
  amount_ratio: '평소 대비 고액',
  tx_hour: '심야 시간대',
  is_overseas: '해외 거래',
  device_changed: '기기 변경',
};

export function getShapFeatureLabel(feature: string): string {
  return SHAP_FEATURE_LABEL[feature] ?? feature;
}

export const transactionSchema = z.object({
  id: z.number(),
  customerId: z.number(),
  /** FDS_ADMIN 외에는 마스킹되어 온다. */
  customerName: z.string(),
  accountNumber: z.string(),
  amount: decimalSchema,
  txHour: z.number(),
  occurredAt: localDateTimeSchema.nullable(),
  isOverseas: z.boolean(),
  deviceChanged: z.boolean(),
  fraudScore: decimalSchema,
  fdsStatus: fdsStatusSchema,
  /** null: 미판정, false: 오탐(정상 거래), true: 실제 사기 */
  isActualFraud: z.boolean().nullable(),
  shapReasons: z.array(shapReasonSchema),
  churnScore: decimalSchema,
});

export type Transaction = z.infer<typeof transactionSchema>;

export const transactionListSchema = z.object({ items: z.array(transactionSchema) });
