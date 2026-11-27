import { useQuery } from '@tanstack/react-query';

import {
  FdsStatusBadge,
  isAwaitingJudgement,
  transactionListQueryOptions,
} from '@/entities/transaction';
import { ResolveFalsePositiveButton } from '@/features/resolve-false-positive';
import { getErrorMessage } from '@/shared/api';
import { formatScore, formatWon } from '@/shared/lib/format';
import { DistributionBar } from '@/shared/ui/distribution-bar';
import { StatusMessage } from '@/shared/ui/status-message';
import { TransactionStats } from '@/widgets/transaction-table';

import { DashboardGrid, DashboardPanel } from './dashboard-panel';
import styles from './dashboard-panel.module.css';

const AWAITING_LIMIT = 5;

/** FDS 관리자: 오늘 판정할 차단 거래와 탐지 현황. */
export function FdsDashboard() {
  const { data, isPending, isError, error } = useQuery(transactionListQueryOptions());

  if (isPending) return <StatusMessage tone="loading">거래 현황을 불러오는 중…</StatusMessage>;
  if (isError) return <StatusMessage tone="error">{getErrorMessage(error)}</StatusMessage>;

  const awaiting = data.filter(isAwaitingJudgement);
  const blocked = data.filter((tx) => tx.fdsStatus === 'BLOCKED');

  return (
    <>
      <TransactionStats />
      <DashboardGrid>
        <DashboardPanel
          title="오탐 판정 대기"
          description={`차단됐지만 아직 판정하지 않은 거래 ${awaiting.length}건`}
          to="/transactions"
        >
          {awaiting.length === 0 ? (
            <p className={styles.empty}>판정할 거래가 없습니다. 🎉</p>
          ) : (
            <ul className={styles.list}>
              {awaiting.slice(0, AWAITING_LIMIT).map((tx) => (
                <li key={tx.id} className={styles.item}>
                  <div className={styles.itemBody}>
                    <span className={styles.itemTitle}>
                      #{tx.id} {tx.customerName}
                      <FdsStatusBadge status={tx.fdsStatus} />
                    </span>
                    <span className={styles.itemSub}>
                      {formatWon(tx.amount)} · 사기 점수 {formatScore(tx.fraudScore)}
                    </span>
                  </div>
                  <ResolveFalsePositiveButton transactionId={tx.id} />
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>
        <DashboardPanel title="탐지 현황" description="전체 거래 기준" to="/transactions">
          <DistributionBar
            label="FDS 상태 분포"
            segments={[
              {
                label: '정상',
                value: data.filter((tx) => tx.fdsStatus === 'NORMAL').length,
                tone: 'success',
              },
              {
                label: '주의',
                value: data.filter((tx) => tx.fdsStatus === 'WARNING').length,
                tone: 'warning',
              },
              { label: '차단', value: blocked.length, tone: 'danger' },
            ]}
          />
          <div style={{ marginTop: 20 }}>
            <DistributionBar
              label="차단 거래 판정 결과"
              segments={[
                {
                  label: '사기 확정',
                  value: blocked.filter((tx) => tx.isActualFraud === true).length,
                  tone: 'danger',
                },
                {
                  label: '오탐',
                  value: blocked.filter((tx) => tx.isActualFraud === false).length,
                  tone: 'success',
                },
                { label: '판정 대기', value: awaiting.length, tone: 'neutral' },
              ]}
            />
          </div>
        </DashboardPanel>
      </DashboardGrid>
    </>
  );
}
