import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import {
  CHURN_HIGH_THRESHOLD,
  CHURN_WARNING_THRESHOLD,
  ChurnReasons,
  CustomerGradeBadge,
  HIGH_RISK_REASON_LABEL,
  type HighRiskReason,
} from '@/entities/customer';
import { FdsStatusBadge } from '@/entities/transaction';
import { SendCareActionButton } from '@/features/send-care-action';
import { getErrorMessage } from '@/shared/api';
import { formatScore } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { FilterChips } from '@/shared/ui/filter-chips';
import { ScoreBar } from '@/shared/ui/score-bar';
import { StatCard, StatGrid } from '@/shared/ui/stat-card';
import { StatusMessage } from '@/shared/ui/status-message';

import {
  type HighRiskCustomer,
  highRiskCustomersQueryOptions,
  type PendingCareAction,
} from '../api/high-risk-customers';
import styles from './high-risk-customer-list.module.css';

type SendResult = { tone: 'success' | 'error'; message: string };
type OnSendResult = (result: SendResult) => void;

function PendingCareActionItem({
  action,
  customerName,
  onSendResult,
}: {
  action: PendingCareAction;
  customerName: string;
  onSendResult: OnSendResult;
}) {
  return (
    <li className={styles.action}>
      <div className={styles.actionBody}>
        <span className={styles.actionTitle}>
          <strong>{action.recommendedProduct}</strong>
          <FdsStatusBadge status={action.fdsStatus} />
          {action.isFalsePositive && <Badge tone="success">오탐 판정</Badge>}
          <span className={styles.muted}>거래 #{action.transactionId}</span>
        </span>
        <span className={styles.message}>{action.actionMessage}</span>
      </div>
      <SendCareActionButton
        careActionId={action.id}
        version={action.version}
        customerName={customerName}
        onResult={onSendResult}
      />
    </li>
  );
}

function HighRiskCustomerItem({
  customer,
  onSendResult,
}: {
  customer: HighRiskCustomer;
  onSendResult: OnSendResult;
}) {
  return (
    <li className={styles.customer} aria-label={`${customer.name} 고객`}>
      <div className={styles.header}>
        <h2 className={styles.name}>{customer.name}</h2>
        <span className={styles.account}>{customer.accountNumber}</span>
        <CustomerGradeBadge grade={customer.grade} />
        {customer.riskReasons.map((reason) => (
          <Badge key={reason} tone="danger">
            {HIGH_RISK_REASON_LABEL[reason]}
          </Badge>
        ))}
      </div>
      <div className={styles.score}>
        <span className={styles.scoreLabel}>이탈 점수</span>
        <ScoreBar
          label="이탈 점수"
          value={customer.churnScore}
          warningAt={CHURN_WARNING_THRESHOLD}
          dangerAt={CHURN_HIGH_THRESHOLD}
        />
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>이탈 요인</h3>
        <ChurnReasons reasons={customer.churnReasons} />
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          대기 중인 케어 조치 {customer.pendingCareActions.length}건
        </h3>
        {customer.pendingCareActions.length > 0 ? (
          <ul className={styles.actions}>
            {customer.pendingCareActions.map((action) => (
              <PendingCareActionItem
                key={action.id}
                action={action}
                customerName={customer.name}
                onSendResult={onSendResult}
              />
            ))}
          </ul>
        ) : (
          <span className={styles.muted}>대기 중인 케어 조치가 없습니다.</span>
        )}
      </div>
    </li>
  );
}

type Filter = 'ALL' | 'PENDING' | HighRiskReason;

const FILTERS: { value: Filter; label: string; match: (customer: HighRiskCustomer) => boolean }[] =
  [
    { value: 'ALL', label: '전체', match: () => true },
    { value: 'PENDING', label: '케어 대기', match: (c) => c.pendingCareActions.length > 0 },
    {
      value: 'FALSE_POSITIVE_VICTIM',
      label: HIGH_RISK_REASON_LABEL.FALSE_POSITIVE_VICTIM,
      match: (c) => c.riskReasons.includes('FALSE_POSITIVE_VICTIM'),
    },
    {
      value: 'HIGH_CHURN_SCORE',
      label: HIGH_RISK_REASON_LABEL.HIGH_CHURN_SCORE,
      match: (c) => c.riskReasons.includes('HIGH_CHURN_SCORE'),
    },
  ];

function HighRiskStats({ customers }: { customers: HighRiskCustomer[] }) {
  const pendingCount = customers.reduce((sum, c) => sum + c.pendingCareActions.length, 0);
  const average =
    customers.length > 0
      ? customers.reduce((sum, c) => sum + c.churnScore, 0) / customers.length
      : 0;

  return (
    <StatGrid label="이탈 위험 요약">
      <StatCard label="이탈 위험 고객" value={customers.length} tone="primary" />
      <StatCard
        label="오탐 피해 고객"
        value={customers.filter((c) => c.isFalsePositiveVictim).length}
        hint="정상 거래가 차단된 고객"
        tone="danger"
      />
      <StatCard label="발송 대기 케어 조치" value={pendingCount} tone="warning" />
      <StatCard label="평균 이탈 점수" value={formatScore(average)} />
    </StatGrid>
  );
}

export function HighRiskCustomerList() {
  const { data, isPending, isError, error } = useQuery(highRiskCustomersQueryOptions());
  // 발송 결과는 목록 위에 보여준다. 성공하면 해당 항목(과 버튼)이 목록에서 빠지기 때문이다.
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');

  if (isPending) return <StatusMessage tone="loading">이탈 위험 고객을 불러오는 중…</StatusMessage>;
  if (isError) return <StatusMessage tone="error">{getErrorMessage(error)}</StatusMessage>;

  const match = FILTERS.find((item) => item.value === filter)?.match ?? (() => true);
  const visible = data.filter(match);

  return (
    <>
      <HighRiskStats customers={data} />
      {sendResult && (
        <p
          role={sendResult.tone === 'error' ? 'alert' : 'status'}
          className={`${styles.notice} ${styles[sendResult.tone]}`}
        >
          {sendResult.message}
        </p>
      )}
      {data.length === 0 ? (
        <StatusMessage>이탈 위험 고객이 없습니다.</StatusMessage>
      ) : (
        <>
          <FilterChips
            label="고객 필터"
            options={FILTERS.map(({ value, label, match: m }) => ({
              value,
              label,
              count: data.filter(m).length,
            }))}
            value={filter}
            onChange={setFilter}
          />
          {visible.length === 0 ? (
            <StatusMessage>조건에 맞는 고객이 없습니다.</StatusMessage>
          ) : (
            <ul className={styles.list}>
              {visible.map((customer) => (
                <HighRiskCustomerItem
                  key={customer.customerId}
                  customer={customer}
                  onSendResult={setSendResult}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
