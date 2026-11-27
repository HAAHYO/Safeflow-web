import { type PropsWithChildren, type ReactNode } from 'react';

import styles from './card.module.css';

type CardProps = PropsWithChildren<{
  title?: string;
  description?: string;
  /** 제목 오른쪽 영역(버튼 · 필터 등) */
  actions?: ReactNode;
  /** 본문 여백을 없앤다(표처럼 가장자리까지 채우는 내용). */
  flush?: boolean;
}>;

export function Card({ title, description, actions, flush = false, children }: CardProps) {
  return (
    <section className={styles.card} aria-label={title}>
      {(title || actions) && (
        <div className={styles.header}>
          <div>
            {title && <h2 className={styles.title}>{title}</h2>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={flush ? styles.flush : styles.body}>{children}</div>
    </section>
  );
}
