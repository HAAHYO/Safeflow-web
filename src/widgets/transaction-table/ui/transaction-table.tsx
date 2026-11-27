import { useQuery } from '@tanstack/react-query';

import {
  FdsStatusBadge,
  ShapReasons,
  type Transaction,
  transactionListQueryOptions,
} from '@/entities/transaction';
import { getErrorMessage } from '@/shared/api';
import { formatLocalDateTime, formatScore, formatWon } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { StatusMessage } from '@/shared/ui/status-message';

import styles from './transaction-table.module.css';

function JudgementBadge({ isActualFraud }: { isActualFraud: boolean | null }) {
  if (isActualFraud === null) return <Badge>미판정</Badge>;
  return isActualFraud ? (
    <Badge tone="danger">사기 확정</Badge>
  ) : (
    <Badge tone="success">오탐</Badge>
  );
}

function conditions(tx: Transaction) {
  const items = [tx.isOverseas && '해외', tx.deviceChanged && '기기 변경'].filter(Boolean);
  return items.length > 0 ? items.join(' · ') : '-';
}

export function TransactionTable() {
  const { data, isPending, isError, error } = useQuery(transactionListQueryOptions());

  if (isPending) return <StatusMessage>거래 내역을 불러오는 중…</StatusMessage>;
  if (isError) return <StatusMessage tone="error">{getErrorMessage(error)}</StatusMessage>;
  if (data.length === 0) return <StatusMessage>거래 내역이 없습니다.</StatusMessage>;

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">고객</th>
            <th scope="col" className={styles.number}>
              금액
            </th>
            <th scope="col">발생 시각</th>
            <th scope="col">조건</th>
            <th scope="col" className={styles.number}>
              사기 점수
            </th>
            <th scope="col">FDS 상태</th>
            <th scope="col">탐지 근거</th>
            <th scope="col">판정</th>
          </tr>
        </thead>
        <tbody>
          {data.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>
                {tx.customerName}
                <span className={styles.sub}>{tx.accountNumber}</span>
              </td>
              <td className={styles.number}>{formatWon(tx.amount)}</td>
              <td>{tx.occurredAt ? formatLocalDateTime(tx.occurredAt) : `${tx.txHour}시`}</td>
              <td>{conditions(tx)}</td>
              <td className={styles.number}>{formatScore(tx.fraudScore)}</td>
              <td>
                <FdsStatusBadge status={tx.fdsStatus} />
              </td>
              <td className={styles.reasons}>
                <ShapReasons reasons={tx.shapReasons} />
              </td>
              <td>
                <JudgementBadge isActualFraud={tx.isActualFraud} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
