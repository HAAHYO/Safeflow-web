import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import {
  CHURN_HIGH_THRESHOLD,
  CHURN_WARNING_THRESHOLD,
  CustomerGradeBadge,
  HIGH_RISK_REASON_LABEL,
} from '@/entities/customer';
import { SendCareActionButton } from '@/features/send-care-action';
import { getErrorMessage } from '@/shared/api';
import { Badge } from '@/shared/ui/badge';
import { ScoreBar } from '@/shared/ui/score-bar';
import { StatCard, StatGrid } from '@/shared/ui/stat-card';
import { StatusMessage } from '@/shared/ui/status-message';
import { careActionListQueryOptions } from '@/widgets/care-action-table';
import { highRiskCustomersQueryOptions } from '@/widgets/high-risk-customer-list';

import { DashboardGrid, DashboardPanel } from './dashboard-panel';
import styles from './dashboard-panel.module.css';

const LIMIT = 5;

type SendResult = { tone: 'success' | 'error'; message: string };

function TopRiskCustomers() {
  const { data, isPending, isError, error } = useQuery(highRiskCustomersQueryOptions());

  if (isPending) return <StatusMessage tone="loading">불러오는 중…</StatusMessage>;
  if (isError) return <StatusMessage tone="error">{getErrorMessage(error)}</StatusMessage>;
  if (data.length === 0) return <p className={styles.empty}>이탈 위험 고객이 없습니다.</p>;

  return (
    <ul className={styles.list}>
      {data.slice(0, LIMIT).map((customer) => (
        <li key={customer.customerId} className={styles.item}>
          <div className={styles.itemBody}>
            <span className={styles.itemTitle}>
              {customer.name}
              <CustomerGradeBadge grade={customer.grade} />
              {customer.riskReasons.map((reason) => (
                <Badge key={reason} tone="danger">
                  {HIGH_RISK_REASON_LABEL[reason]}
                </Badge>
              ))}
            </span>
            <span className={styles.itemSub}>
              대기 케어 조치 {customer.pendingCareActions.length}건
            </span>
          </div>
          <ScoreBar
            label={`${customer.name} 이탈 점수`}
            value={customer.churnScore}
            warningAt={CHURN_WARNING_THRESHOLD}
            dangerAt={CHURN_HIGH_THRESHOLD}
          />
        </li>
      ))}
    </ul>
  );
}

function PendingCareActions({ onSendResult }: { onSendResult: (result: SendResult) => void }) {
  const { data, isPending, isError, error } = useQuery(careActionListQueryOptions());

  if (isPending) return <StatusMessage tone="loading">불러오는 중…</StatusMessage>;
  if (isError) return <StatusMessage tone="error">{getErrorMessage(error)}</StatusMessage>;

  const pending = data.filter((action) => action.status === 'PENDING');
  if (pending.length === 0) return <p className={styles.empty}>발송할 케어 조치가 없습니다. 🎉</p>;

  return (
    <ul className={styles.list}>
      {pending.slice(0, LIMIT).map((action) => (
        <li key={action.id} className={styles.item}>
          <div className={styles.itemBody}>
            <span className={styles.itemTitle}>
              {action.customerName}
              {action.isFalsePositiveVictim && <Badge tone="danger">오탐 피해</Badge>}
            </span>
            <span className={styles.itemSub}>{action.recommendedProduct}</span>
          </div>
          <SendCareActionButton
            careActionId={action.id}
            version={action.version}
            customerName={action.customerName}
            onResult={onSendResult}
          />
        </li>
      ))}
    </ul>
  );
}

function CrmStats() {
  const highRisk = useQuery(highRiskCustomersQueryOptions()).data;
  const careActions = useQuery(careActionListQueryOptions()).data;
  const format = (value: number | undefined) => (value === undefined ? '-' : value);

  return (
    <StatGrid label="CRM 요약">
      <StatCard label="이탈 위험 고객" value={format(highRisk?.length)} tone="primary" />
      <StatCard
        label="오탐 피해 고객"
        value={format(highRisk?.filter((c) => c.isFalsePositiveVictim).length)}
        hint="정상 거래가 차단된 고객"
        tone="danger"
      />
      <StatCard
        label="발송 대기 케어 조치"
        value={format(careActions?.filter((a) => a.status === 'PENDING').length)}
        tone="warning"
      />
      <StatCard
        label="발송 완료 케어 조치"
        value={format(careActions?.filter((a) => a.status === 'SENT').length)}
        tone="success"
      />
    </StatGrid>
  );
}

/** CRM 마케터: 이탈 위험이 큰 고객과 오늘 보낼 케어 조치. */
export function CrmDashboard() {
  // 발송하면 해당 항목이 목록에서 빠지므로 결과는 대시보드 위쪽에 보여준다.
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  return (
    <>
      <CrmStats />
      {sendResult && (
        <p
          role={sendResult.tone === 'error' ? 'alert' : 'status'}
          style={{
            margin: 0,
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
            background: `var(--color-${sendResult.tone === 'error' ? 'danger' : 'success'}-bg)`,
            color: `var(--color-${sendResult.tone === 'error' ? 'danger' : 'success'})`,
            fontWeight: 500,
          }}
        >
          {sendResult.message}
        </p>
      )}
      <DashboardGrid>
        <DashboardPanel title="이탈 위험 상위 고객" description="이탈 점수가 높은 순" to="/crm">
          <TopRiskCustomers />
        </DashboardPanel>
        <DashboardPanel title="발송 대기 케어 조치" description="최신순" to="/care-actions">
          <PendingCareActions onSendResult={setSendResult} />
        </DashboardPanel>
      </DashboardGrid>
    </>
  );
}
