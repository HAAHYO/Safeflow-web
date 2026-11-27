import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useSession } from '@/entities/session';
import {
  FDS_BLOCK_THRESHOLD,
  FDS_WARNING_THRESHOLD,
  FdsStatusBadge,
  isAwaitingJudgement,
  ShapReasons,
  type Transaction,
  transactionListQueryOptions,
} from '@/entities/transaction';
import { ResolveFalsePositiveButton } from '@/features/resolve-false-positive';
import { getErrorMessage } from '@/shared/api';
import { formatLocalDateTime, formatWon } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { FilterChips } from '@/shared/ui/filter-chips';
import { Icon } from '@/shared/ui/icon';
import { ScoreBar } from '@/shared/ui/score-bar';
import { StatusMessage } from '@/shared/ui/status-message';
import { Table } from '@/shared/ui/table';

import styles from './transaction-table.module.css';

type Filter = 'ALL' | 'AWAITING' | 'BLOCKED' | 'WARNING' | 'NORMAL';

const FILTERS: { value: Filter; label: string; match: (tx: Transaction) => boolean }[] = [
  { value: 'ALL', label: '전체', match: () => true },
  { value: 'AWAITING', label: '판정 대기', match: isAwaitingJudgement },
  { value: 'BLOCKED', label: '차단', match: (tx) => tx.fdsStatus === 'BLOCKED' },
  { value: 'WARNING', label: '주의', match: (tx) => tx.fdsStatus === 'WARNING' },
  { value: 'NORMAL', label: '정상', match: (tx) => tx.fdsStatus === 'NORMAL' },
];

function matchesSearch(tx: Transaction, keyword: string) {
  if (!keyword) return true;
  return [String(tx.id), tx.customerName, tx.accountNumber].some((text) => text.includes(keyword));
}

function JudgementBadge({ isActualFraud }: { isActualFraud: boolean | null }) {
  if (isActualFraud === null) return <Badge>미판정</Badge>;
  return isActualFraud ? (
    <Badge tone="danger">사기 확정</Badge>
  ) : (
    <Badge tone="success">오탐</Badge>
  );
}

function Conditions({ tx }: { tx: Transaction }) {
  if (!tx.isOverseas && !tx.deviceChanged) return <span className={styles.muted}>-</span>;
  return (
    <span className={styles.conditions}>
      {tx.isOverseas && <Badge tone="info">해외</Badge>}
      {tx.deviceChanged && <Badge tone="info">기기 변경</Badge>}
    </span>
  );
}

export function TransactionTable() {
  const { data, isPending, isError, error } = useQuery(transactionListQueryOptions());
  const isFdsAdmin = useSession()?.role === 'FDS_ADMIN';
  const [filter, setFilter] = useState<Filter>('ALL');
  const [keyword, setKeyword] = useState('');

  const options = useMemo(
    () =>
      FILTERS.map(({ value, label, match }) => ({
        value,
        label,
        count: data?.filter(match).length,
      })),
    [data],
  );

  const rows = useMemo(() => {
    const match = FILTERS.find((item) => item.value === filter)?.match ?? (() => true);
    const trimmed = keyword.trim();
    return (data ?? []).filter((tx) => match(tx) && matchesSearch(tx, trimmed));
  }, [data, filter, keyword]);

  const toolbar = (
    <div className={styles.toolbar}>
      <FilterChips label="거래 필터" options={options} value={filter} onChange={setFilter} />
      <label className={styles.search}>
        <Icon name="search" size={16} />
        <input
          type="search"
          placeholder="거래 ID · 고객 · 계좌 검색"
          aria-label="거래 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </label>
    </div>
  );

  return (
    <Card title="거래 목록" description="최신순으로 보여줍니다." actions={toolbar} flush>
      {isPending ? (
        <StatusMessage tone="loading">거래 내역을 불러오는 중…</StatusMessage>
      ) : isError ? (
        <StatusMessage tone="error">{getErrorMessage(error)}</StatusMessage>
      ) : data.length === 0 ? (
        <StatusMessage>거래 내역이 없습니다.</StatusMessage>
      ) : rows.length === 0 ? (
        <StatusMessage>조건에 맞는 거래가 없습니다.</StatusMessage>
      ) : (
        <Table>
          <thead>
            <tr>
              <th scope="col">거래</th>
              <th scope="col">고객</th>
              <th scope="col" data-align="right">
                금액
              </th>
              <th scope="col">조건</th>
              <th scope="col">사기 점수</th>
              <th scope="col">FDS 상태</th>
              <th scope="col">탐지 근거</th>
              <th scope="col">판정</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => (
              <tr key={tx.id} data-highlight={isAwaitingJudgement(tx) ? 'danger' : undefined}>
                <td>
                  <strong>#{tx.id}</strong>
                  <span className={styles.sub}>
                    {tx.occurredAt ? formatLocalDateTime(tx.occurredAt) : `${tx.txHour}시`}
                  </span>
                </td>
                <td>
                  {tx.customerName}
                  <span className={styles.sub}>{tx.accountNumber}</span>
                </td>
                <td data-align="right">
                  <strong>{formatWon(tx.amount)}</strong>
                </td>
                <td>
                  <Conditions tx={tx} />
                </td>
                <td>
                  <ScoreBar
                    label="사기 점수"
                    value={tx.fraudScore}
                    warningAt={FDS_WARNING_THRESHOLD}
                    dangerAt={FDS_BLOCK_THRESHOLD}
                  />
                </td>
                <td>
                  <FdsStatusBadge status={tx.fdsStatus} />
                </td>
                <td data-wrap>
                  <ShapReasons reasons={tx.shapReasons} />
                </td>
                <td>
                  {isFdsAdmin && isAwaitingJudgement(tx) ? (
                    <ResolveFalsePositiveButton transactionId={tx.id} />
                  ) : (
                    <JudgementBadge isActualFraud={tx.isActualFraud} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
