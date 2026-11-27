import { getErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui/button';

import { useResolveFalsePositive } from '../model/use-resolve-false-positive';
import styles from './resolve-false-positive-button.module.css';

export function ResolveFalsePositiveButton({ transactionId }: { transactionId: number }) {
  const resolve = useResolveFalsePositive();

  const handleClick = () => {
    // 되돌릴 수 없는 판정이라 한 번 더 확인한다.
    if (!window.confirm(`오탐(정상 거래)으로 판정할까요? (거래 #${transactionId})`)) return;
    resolve.mutate(transactionId);
  };

  return (
    <div className={styles.wrapper}>
      <Button variant="secondary" onClick={handleClick} disabled={resolve.isPending}>
        {resolve.isPending ? '처리 중…' : '오탐 판정'}
      </Button>
      {resolve.isError && (
        <span role="alert" className={styles.error}>
          {getErrorMessage(resolve.error)}
        </span>
      )}
    </div>
  );
}
