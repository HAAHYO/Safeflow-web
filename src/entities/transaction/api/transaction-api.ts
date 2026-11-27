import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/shared/api';

import { transactionListSchema } from '../model/transaction';

export const transactionKeys = {
  all: ['transaction'] as const,
  list: () => [...transactionKeys.all, 'list'] as const,
};

/** 거래 내역(최신순). */
export async function fetchTransactions() {
  const { data } = await apiClient.get('/api/transactions');
  return transactionListSchema.parse(data).items;
}

export const transactionListQueryOptions = () =>
  queryOptions({ queryKey: transactionKeys.list(), queryFn: fetchTransactions });
