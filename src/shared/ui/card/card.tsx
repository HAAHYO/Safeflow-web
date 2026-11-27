import { type PropsWithChildren, type ReactNode } from 'react';

import styles from './card.module.css';

type CardProps = PropsWithChildren<{
  title?: string;
  /** 제목 오른쪽 영역(버튼 등) */
  actions?: ReactNode;
}>;

export function Card({ title, actions, children }: CardProps) {
  return (
    <section className={styles.card}>
      {(title || actions) && (
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
