import { type PropsWithChildren } from 'react';

import styles from './badge.module.css';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type BadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
  /** 앞에 상태 점을 붙인다(상태 표시용). */
  dot?: boolean;
}>;

export function Badge({ tone = 'neutral', dot = false, children }: BadgeProps) {
  const className = [styles.badge, styles[tone], dot && styles.dot].filter(Boolean).join(' ');
  return <span className={className}>{children}</span>;
}
