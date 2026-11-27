import { type ComponentProps } from 'react';

import styles from './table.module.css';

/**
 * 데이터 표. 셀 정렬 · 줄바꿈은 data 속성으로 지정한다.
 * - `data-align="right"`: 숫자 열(오른쪽 정렬 · 고정폭 숫자)
 * - `data-wrap`: 긴 텍스트 열(줄바꿈 허용)
 * - `<tr data-highlight="danger">`: 강조 행
 */
export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className={styles.scroll}>
      <table className={[styles.table, className].filter(Boolean).join(' ')} {...props} />
    </div>
  );
}
