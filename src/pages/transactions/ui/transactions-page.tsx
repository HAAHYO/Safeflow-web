import { Card } from '@/shared/ui/card';
import { TransactionTable } from '@/widgets/transaction-table';

import styles from './transactions-page.module.css';

export function TransactionsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>거래 내역</h1>
      <Card title="최근 거래">
        <TransactionTable />
      </Card>
    </div>
  );
}
