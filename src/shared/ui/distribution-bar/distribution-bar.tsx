import styles from './distribution-bar.module.css';

export type DistributionSegment = {
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
};

type DistributionBarProps = {
  /** 스크린리더용 이름 (예: "FDS 상태 분포") */
  label: string;
  segments: DistributionSegment[];
};

/** 전체 대비 비율을 가로 막대로 보여준다. 수치는 범례에 글자로도 적어 색에만 의존하지 않는다. */
export function DistributionBar({ label, segments }: DistributionBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const percent = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  return (
    <figure style={{ margin: 0 }}>
      <div className={styles.bar} aria-hidden="true">
        {segments.map((segment) =>
          segment.value > 0 ? (
            <span
              key={segment.label}
              className={`${styles.segment} ${styles[segment.tone]}`}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <figcaption>
        <ul className={styles.legend} aria-label={label}>
          {segments.map((segment) => (
            <li key={segment.label} className={styles.legendItem}>
              <span className={`${styles.swatch} ${styles[segment.tone]}`} aria-hidden="true" />
              {segment.label}
              <span className={styles.value}>
                {segment.value}건 ({percent(segment.value)}%)
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
