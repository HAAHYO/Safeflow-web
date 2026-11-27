import { formatScore } from '@/shared/lib/format';

import { getShapFeatureLabel, type ShapReason } from '../model/transaction';
import styles from './shap-reasons.module.css';

/**
 * FDS 탐지 근거(SHAP 기여도). 백엔드가 기여도가 큰 순으로 최대 3개를 보낸다.
 * 기여도의 합이 사기 점수라서 점수와 같은 % 단위로 보여준다.
 */
export function ShapReasons({ reasons }: { reasons: ShapReason[] }) {
  if (reasons.length === 0) return <span className={styles.empty}>특이 요인 없음</span>;

  return (
    <ul className={styles.list}>
      {reasons.map((reason) => (
        <li key={reason.feature}>
          {getShapFeatureLabel(reason.feature)}{' '}
          <span className={styles.value}>
            {reason.shap > 0 ? '+' : ''}
            {formatScore(reason.shap)}
          </span>
        </li>
      ))}
    </ul>
  );
}
