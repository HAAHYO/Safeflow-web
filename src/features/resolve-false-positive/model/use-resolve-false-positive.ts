import { useMutation, useQueryClient } from '@tanstack/react-query';

import { transactionKeys } from '@/entities/transaction';

import { resolveFalsePositive } from '../api/resolve-false-positive';

export function useResolveFalsePositive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: number) => resolveFalsePositive(transactionId),
    // 실패(TRANSACTION_ALREADY_JUDGED 등)도 목록이 오래됐다는 뜻이라 성공 · 실패 모두 다시 불러온다.
    // TODO(feature/crm-high-risk, feature/care-actions): 오탐 고객 · 케어 조치 key 도 추가한다.
    onSettled: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}
