import { formatScore } from '@/shared/lib/format';

import { type ChurnReason, getChurnFeatureLabel } from '../model/customer';
import styles from './churn-reasons.module.css';

/** 이탈 요인. 기여도는 이탈 확률에 더해지는 몫이라 이탈 점수와 같은 % 로 보여준다. */
export function ChurnReasons({ reasons }: { reasons: ChurnReason[] }) {
  if (reasons.length === 0) return <span className={styles.empty}>뚜렷한 이탈 요인 없음</span>;

  return (
    <ul className={styles.list}>
      {reasons.map((reason) => (
        <li key={reason.feature}>
          {getChurnFeatureLabel(reason.feature)}{' '}
          <span className={styles.value}>+{formatScore(reason.contribution)}</span>
        </li>
      ))}
    </ul>
  );
}
