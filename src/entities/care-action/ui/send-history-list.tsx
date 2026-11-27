import { useQuery } from '@tanstack/react-query';

import { getErrorMessage } from '@/shared/api';
import { formatLocalDateTime } from '@/shared/lib/format';

import { sendHistoryQueryOptions } from '../api/send-history';
import styles from './send-history-list.module.css';

/** 케어 조치 하나의 발송 이력. 펼칠 때 처음 불러온다. */
export function SendHistoryList({ careActionId }: { careActionId: number }) {
  const { data, isPending, isError, error } = useQuery(sendHistoryQueryOptions(careActionId));

  return (
    <section className={styles.wrapper} aria-label={`케어 조치 #${careActionId} 발송 이력`}>
      <h3 className={styles.title}>발송 이력</h3>
      {isPending ? (
        <p className={styles.state} role="status">
          발송 이력을 불러오는 중…
        </p>
      ) : isError ? (
        <p className={styles.error} role="alert">
          {getErrorMessage(error)}
        </p>
      ) : data.length === 0 ? (
        <p className={styles.state}>아직 발송한 적이 없습니다.</p>
      ) : (
        <ol className={styles.list}>
          {data.map((history) => (
            <li key={history.id} className={styles.item}>
              <span className={styles.meta}>
                {formatLocalDateTime(history.sentAt)} · {history.sentBy} · 버전{' '}
                {history.careActionVersion}
              </span>
              <p className={styles.product}>{history.recommendedProduct}</p>
              <p className={styles.message}>{history.actionMessage}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
