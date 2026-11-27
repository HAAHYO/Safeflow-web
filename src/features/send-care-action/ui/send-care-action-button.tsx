import { getErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui/button';

import { type SendCareActionRequest } from '../api/send-care-action';
import { useSendCareAction } from '../model/use-send-care-action';

type SendCareActionButtonProps = SendCareActionRequest & {
  /** 확인 창 · 결과 문구에 쓰는 고객 이름 */
  customerName: string;
  /**
   * 결과 문구. 성공하면 이 항목이 목록에서 빠지며 버튼도 사라지므로,
   * 문구는 버튼이 아니라 목록(부모)이 보여준다.
   */
  onResult?: (result: { tone: 'success' | 'error'; message: string }) => void;
};

export function SendCareActionButton({
  careActionId,
  version,
  customerName,
  onResult,
}: SendCareActionButtonProps) {
  const send = useSendCareAction({
    onSuccess: () =>
      onResult?.({
        tone: 'success',
        message: `${customerName} 고객에게 케어 조치를 발송 처리했습니다.`,
      }),
    onError: (error) =>
      onResult?.({ tone: 'error', message: `${customerName}: ${getErrorMessage(error)}` }),
  });

  const handleClick = () => {
    if (!window.confirm(`${customerName} 고객에게 케어 조치를 발송 처리할까요?`)) return;
    send.mutate({ careActionId, version });
  };

  return (
    <Button onClick={handleClick} disabled={send.isPending}>
      {send.isPending ? '처리 중…' : '발송 처리'}
    </Button>
  );
}
