import { useMutation, useQueryClient } from '@tanstack/react-query';

import { transactionKeys } from '@/entities/transaction';

import { simulateTransaction, type SimulateTransactionRequest } from '../api/simulate-transaction';

export function useSimulateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SimulateTransactionRequest) => simulateTransaction(request),
    // 새 거래가 생기고 이탈 점수 · 케어 조치도 바뀌므로 관련 목록을 다시 불러온다.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}
