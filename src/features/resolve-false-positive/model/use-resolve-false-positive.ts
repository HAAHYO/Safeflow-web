import { useMutation, useQueryClient } from '@tanstack/react-query';

import { careActionKeys } from '@/entities/care-action';
import { customerKeys } from '@/entities/customer';
import { transactionKeys } from '@/entities/transaction';

import { resolveFalsePositive } from '../api/resolve-false-positive';

export function useResolveFalsePositive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: number) => resolveFalsePositive(transactionId),
    // 서버가 고객을 오탐 피해자로 표시하고 케어 조치를 다시 짠다.
    // 실패(TRANSACTION_ALREADY_JUDGED 등)도 목록이 오래됐다는 뜻이라 성공 · 실패 모두 다시 불러온다.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
        queryClient.invalidateQueries({ queryKey: careActionKeys.all }),
      ]),
  });
}
