import { useQuery } from '@tanstack/react-query';

import { transactionListQueryOptions } from '@/entities/transaction';
import { StatCard, StatGrid } from '@/shared/ui/stat-card';

import { isAwaitingJudgement } from '../lib/transaction';

/** 거래 요약 수치. 거래 목록과 같은 쿼리(캐시)를 쓴다. */
export function TransactionStats() {
  const { data } = useQuery(transactionListQueryOptions());
  const count = (predicate: (tx: NonNullable<typeof data>[number]) => boolean) =>
    data ? data.filter(predicate).length.toLocaleString('ko-KR') : '-';

  return (
    <StatGrid label="거래 요약">
      <StatCard label="전체 거래" value={count(() => true)} tone="primary" />
      <StatCard
        label="차단"
        value={count((tx) => tx.fdsStatus === 'BLOCKED')}
        hint="사기 점수 80% 이상"
        tone="danger"
      />
      <StatCard
        label="주의"
        value={count((tx) => tx.fdsStatus === 'WARNING')}
        hint="사기 점수 50% 이상"
        tone="warning"
      />
      <StatCard
        label="판정 대기"
        value={count(isAwaitingJudgement)}
        hint="차단됐지만 미판정"
        tone="neutral"
      />
    </StatGrid>
  );
}
