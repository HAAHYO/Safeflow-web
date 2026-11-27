import { getErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui/button';

import { type SendCareActionRequest } from '../api/send-care-action';
import { useSendCareAction } from '../model/use-send-care-action';
import styles from './send-care-action-button.module.css';

type SendCareActionButtonProps = SendCareActionRequest & {
  /** 확인 창에 보여줄 고객 이름 */
  customerName: string;
};

export function SendCareActionButton({
  careActionId,
  version,
  customerName,
}: SendCareActionButtonProps) {
  const send = useSendCareAction();

  const handleClick = () => {
    if (!window.confirm(`${customerName} 고객에게 케어 조치를 발송 처리할까요?`)) return;
    send.mutate({ careActionId, version });
  };

  return (
    <div className={styles.wrapper}>
      <Button onClick={handleClick} disabled={send.isPending}>
        {send.isPending ? '처리 중…' : '발송 처리'}
      </Button>
      {send.isError && (
        <span role="alert" className={styles.error}>
          {getErrorMessage(send.error)}
        </span>
      )}
    </div>
  );
}
