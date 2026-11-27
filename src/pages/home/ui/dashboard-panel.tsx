import { type PropsWithChildren } from 'react';
import { Link } from 'react-router';

import { Card } from '@/shared/ui/card';

import styles from './dashboard-panel.module.css';

type DashboardPanelProps = PropsWithChildren<{
  title: string;
  description?: string;
  /** "전체 보기" 링크 대상 */
  to?: string;
  linkLabel?: string;
}>;

/** 대시보드의 카드 하나. 오른쪽 위에 해당 화면으로 가는 링크를 둔다. */
export function DashboardPanel({
  title,
  description,
  to,
  linkLabel = '전체 보기',
  children,
}: DashboardPanelProps) {
  return (
    <Card
      title={title}
      description={description}
      actions={
        to && (
          <Link to={to} className={styles.link} aria-label={`${title} ${linkLabel}`}>
            {linkLabel} →
          </Link>
        )
      }
    >
      {children}
    </Card>
  );
}

/** 대시보드 카드를 2열로 놓는다(좁은 화면은 1열). */
export function DashboardGrid({ children }: PropsWithChildren) {
  return <div className={styles.grid}>{children}</div>;
}
