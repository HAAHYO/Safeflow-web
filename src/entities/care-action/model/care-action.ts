import { z } from 'zod';

export const careActionStatusSchema = z.enum(['PENDING', 'SENT']);

export type CareActionStatus = z.infer<typeof careActionStatusSchema>;

export const CARE_ACTION_STATUS_LABEL: Record<CareActionStatus, string> = {
  PENDING: '발송 대기',
  SENT: '발송 완료',
};
