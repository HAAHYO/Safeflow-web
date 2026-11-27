import { z } from 'zod';

import { careActionStatusSchema } from '@/entities/care-action';
import { apiClient } from '@/shared/api';

export type SendCareActionRequest = {
  careActionId: number;
  /** 조회했을 때의 version. 그 사이 내용이 바뀌었으면 서버가 CARE_ACTION_STALE(409)로 거절한다. */
  version: number;
};

// 화면에서 쓰는 필드만 검증한다. 발송은 이미 서버에서 끝났으므로 나머지 형식 차이로 실패시키지 않는다.
const sendCareActionResponseSchema = z.object({
  id: z.number(),
  status: careActionStatusSchema,
  version: z.number(),
});

/** 케어 조치를 발송 처리한다(SENT 로 바꾸고 발송자를 기록). 실제 메시지는 보내지 않는다. */
export async function sendCareAction({ careActionId, version }: SendCareActionRequest) {
  const { data } = await apiClient.patch(`/api/care-actions/${careActionId}/send`, { version });
  return sendCareActionResponseSchema.parse(data);
}
