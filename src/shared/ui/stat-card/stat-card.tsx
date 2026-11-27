import { type PropsWithChildren, type ReactNode } from 'react';

import styles from './stat-card.module.css';

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'neutral' | 'primary' | 'danger' | 'warning' | 'success';
};

/** 요약 수치 카드. 왼쪽 색 띠로 의미(위험 · 주의 등)를 구분한다. */
export function StatCard({ label, value, hint, tone = 'neutral' }: StatCardProps) {
  return (
    <div className={`${styles.card} ${tone !== 'neutral' ? styles[tone] : ''}`}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value} style={{ margin: 0 }}>
        {value}
      </dd>
      {hint && <dd className={styles.hint}>{hint}</dd>}
    </div>
  );
}

/** StatCard 묶음. 설명 목록(dl)으로 감싸 스크린리더가 "이름: 값" 으로 읽게 한다. */
export function StatGrid({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <dl className={styles.grid} aria-label={label} style={{ margin: 0 }}>
      {children}
    </dl>
  );
}
