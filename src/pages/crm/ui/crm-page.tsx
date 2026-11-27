import { HighRiskCustomerList } from '@/widgets/high-risk-customer-list';

import styles from './crm-page.module.css';

export function CrmPage() {
  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>이탈 위험 고객</h1>
        <p className={styles.description}>
          오탐 피해 고객이거나 이탈 점수 60% 이상인 고객입니다. 이탈 점수가 높은 순으로 보여줍니다.
        </p>
      </div>
      <HighRiskCustomerList />
    </div>
  );
}
