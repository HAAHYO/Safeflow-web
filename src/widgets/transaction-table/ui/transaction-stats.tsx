import { useQuery } from '@tanstack/react-query';

import {
  FDS_BLOCK_THRESHOLD,
  FDS_WARNING_THRESHOLD,
  isAwaitingJudgement,
  transactionListQueryOptions,
} from '@/entities/transaction';
import { formatScore } from '@/shared/lib/format';
import { StatCard, StatGrid } from '@/shared/ui/stat-card';

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
        hint={`사기 점수 ${formatScore(FDS_BLOCK_THRESHOLD)} 이상`}
        tone="danger"
      />
      <StatCard
        label="주의"
        value={count((tx) => tx.fdsStatus === 'WARNING')}
        hint={`사기 점수 ${formatScore(FDS_WARNING_THRESHOLD)} 이상`}
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
