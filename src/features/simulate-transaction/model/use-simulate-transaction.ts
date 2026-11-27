import { useMutation, useQueryClient } from '@tanstack/react-query';

import { careActionKeys } from '@/entities/care-action';
import { customerKeys } from '@/entities/customer';
import { transactionKeys } from '@/entities/transaction';

import { simulateTransaction, type SimulateTransactionRequest } from '../api/simulate-transaction';

export function useSimulateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SimulateTransactionRequest) => simulateTransaction(request),
    // 서버가 거래 생성과 함께 이탈 점수를 다시 계산하고, 주의 · 차단이면 케어 조치를 만든다.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
        queryClient.invalidateQueries({ queryKey: careActionKeys.all }),
      ]),
  });
}
