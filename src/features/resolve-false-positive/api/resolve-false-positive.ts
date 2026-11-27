import { transactionSchema } from '@/entities/transaction';
import { apiClient } from '@/shared/api';

/** 차단된 미판정 거래를 정상 거래(오탐)로 판정한다. 서버가 해당 고객을 케어 대상으로 등록한다. */
export async function resolveFalsePositive(transactionId: number) {
  const { data } = await apiClient.patch(
    `/api/transactions/${transactionId}/resolve-false-positive`,
  );
  return transactionSchema.parse(data);
}
