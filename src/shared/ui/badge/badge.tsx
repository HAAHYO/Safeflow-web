import { type PropsWithChildren } from 'react';

import styles from './badge.module.css';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

export function Badge({ tone = 'neutral', children }: PropsWithChildren<{ tone?: BadgeTone }>) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
