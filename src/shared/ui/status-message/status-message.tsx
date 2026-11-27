import { type PropsWithChildren } from 'react';

import styles from './status-message.module.css';

/** 목록의 로딩 · 빈 상태 · 에러 문구. 에러는 스크린리더가 바로 읽도록 role="alert". */
export function StatusMessage({
  tone = 'muted',
  children,
}: PropsWithChildren<{ tone?: 'muted' | 'error' }>) {
  return tone === 'error' ? (
    <p role="alert" className={`${styles.message} ${styles.error}`}>
      {children}
    </p>
  ) : (
    <p className={styles.message}>{children}</p>
  );
}
