import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { ChurnReasons, CustomerGradeBadge, HIGH_RISK_REASON_LABEL } from '@/entities/customer';
import { FdsStatusBadge } from '@/entities/transaction';
import { SendCareActionButton } from '@/features/send-care-action';
import { getErrorMessage } from '@/shared/api';
import { formatScore } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
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
        <span className={styles.score}>
          <span className={styles.scoreValue}>{formatScore(customer.churnScore)}</span>
          <span className={styles.scoreLabel}>이탈 점수</span>
        </span>
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

export function HighRiskCustomerList() {
  const { data, isPending, isError, error } = useQuery(highRiskCustomersQueryOptions());
  // 발송 결과는 목록 위에 보여준다. 성공하면 해당 항목(과 버튼)이 목록에서 빠지기 때문이다.
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  if (isPending) return <StatusMessage>이탈 위험 고객을 불러오는 중…</StatusMessage>;
  if (isError) return <StatusMessage tone="error">{getErrorMessage(error)}</StatusMessage>;

  return (
    <>
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
        <ul className={styles.list}>
          {data.map((customer) => (
            <HighRiskCustomerItem
              key={customer.customerId}
              customer={customer}
              onSendResult={setSendResult}
            />
          ))}
        </ul>
      )}
    </>
  );
}
