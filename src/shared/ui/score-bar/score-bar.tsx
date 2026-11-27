import styles from './score-bar.module.css';

type ScoreBarProps = {
  /** 0-1 점수 */
  value: number;
  /** 스크린리더용 이름 (예: "사기 점수") */
  label: string;
  /** 이 값 이상이면 주의(주황) */
  warningAt: number;
  /** 이 값 이상이면 위험(빨강) */
  dangerAt: number;
};

/** 0-1 점수를 막대와 % 로 보여준다. 임계값에 따라 색이 바뀐다. */
export function ScoreBar({ value, label, warningAt, dangerAt }: ScoreBarProps) {
  const percent = Math.min(Math.max(value, 0), 1) * 100;
  const tone = value >= dangerAt ? styles.danger : value >= warningAt ? styles.warning : '';

  return (
    <span className={`${styles.wrapper} ${tone}`}>
      <span
        className={styles.track}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number(percent.toFixed(1))}
      >
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      </span>
      <span className={styles.value}>{percent.toFixed(1)}%</span>
    </span>
  );
}
