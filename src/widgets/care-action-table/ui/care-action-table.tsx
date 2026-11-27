import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { CareActionStatusBadge } from '@/entities/care-action';
import {
  CHURN_HIGH_THRESHOLD,
  CHURN_WARNING_THRESHOLD,
  CustomerGradeBadge,
} from '@/entities/customer';
import { getErrorMessage } from '@/shared/api';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { FilterChips } from '@/shared/ui/filter-chips';
import { Icon } from '@/shared/ui/icon';
import { ScoreBar } from '@/shared/ui/score-bar';
import { StatusMessage } from '@/shared/ui/status-message';
import { Table } from '@/shared/ui/table';

import { type CareAction, careActionListQueryOptions } from '../api/care-actions';
import styles from './care-action-table.module.css';

type Filter = 'ALL' | 'PENDING' | 'SENT' | 'VICTIM';

const FILTERS: { value: Filter; label: string; match: (action: CareAction) => boolean }[] = [
  { value: 'ALL', label: '전체', match: () => true },
  { value: 'PENDING', label: '발송 대기', match: (a) => a.status === 'PENDING' },
  { value: 'SENT', label: '발송 완료', match: (a) => a.status === 'SENT' },
  { value: 'VICTIM', label: '오탐 피해 고객', match: (a) => a.isFalsePositiveVictim },
];

function matchesSearch(action: CareAction, keyword: string) {
  if (!keyword) return true;
  return [action.customerName, action.accountNumber, action.recommendedProduct].some((text) =>
    text.includes(keyword),
  );
}

export function CareActionTable() {
  const { data, isPending, isError, error } = useQuery(careActionListQueryOptions());
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
    return (data ?? []).filter((action) => match(action) && matchesSearch(action, trimmed));
  }, [data, filter, keyword]);

  const toolbar = (
    <div className={styles.toolbar}>
      <FilterChips label="케어 조치 필터" options={options} value={filter} onChange={setFilter} />
      <label className={styles.search}>
        <Icon name="search" size={16} />
        <input
          type="search"
          placeholder="고객 · 계좌 · 상품 검색"
          aria-label="케어 조치 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </label>
    </div>
  );

  return (
    <Card title="케어 조치 목록" description="최신순으로 보여줍니다." actions={toolbar} flush>
      {isPending ? (
        <StatusMessage tone="loading">케어 조치를 불러오는 중…</StatusMessage>
      ) : isError ? (
        <StatusMessage tone="error">{getErrorMessage(error)}</StatusMessage>
      ) : data.length === 0 ? (
        <StatusMessage>케어 조치가 없습니다.</StatusMessage>
      ) : rows.length === 0 ? (
        <StatusMessage>조건에 맞는 케어 조치가 없습니다.</StatusMessage>
      ) : (
        <Table>
          <thead>
            <tr>
              <th scope="col">조치</th>
              <th scope="col">고객</th>
              <th scope="col">이탈 점수</th>
              <th scope="col">추천 상품 · 안내 문구</th>
              <th scope="col">상태</th>
              <th scope="col">발송자</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((action) => (
              <tr key={action.id}>
                <td>
                  <strong>#{action.id}</strong>
                  <span className={styles.sub}>거래 #{action.transactionId}</span>
                </td>
                <td>
                  <span className={styles.customer}>
                    {action.customerName}
                    <CustomerGradeBadge grade={action.customerGrade} />
                    {action.isFalsePositiveVictim && <Badge tone="danger">오탐 피해</Badge>}
                  </span>
                  <span className={styles.sub}>{action.accountNumber}</span>
                </td>
                <td>
                  <ScoreBar
                    label="이탈 점수"
                    value={action.churnScore}
                    warningAt={CHURN_WARNING_THRESHOLD}
                    dangerAt={CHURN_HIGH_THRESHOLD}
                  />
                </td>
                <td data-wrap>
                  <span className={styles.product}>{action.recommendedProduct}</span>
                  <span className={styles.message}>{action.actionMessage}</span>
                </td>
                <td>
                  <CareActionStatusBadge status={action.status} />
                </td>
                <td>{action.sentBy ?? <span className={styles.muted}>-</span>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
