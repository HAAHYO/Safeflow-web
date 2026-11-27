import { useMutation, useQueryClient } from '@tanstack/react-query';

import { careActionKeys } from '@/entities/care-action';
import { customerKeys } from '@/entities/customer';

import { sendCareAction, type SendCareActionRequest } from '../api/send-care-action';

type Options = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

/**
 * 결과 콜백은 mutate(…, { onSuccess }) 가 아니라 여기(훅 옵션)로 받는다.
 * 발송에 성공하면 목록이 갱신되며 버튼이 언마운트되는데, mutate 쪽 콜백은 언마운트되면 불리지 않는다.
 */
export function useSendCareAction({ onSuccess, onError }: Options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendCareActionRequest) => sendCareAction(request),
    onSuccess: () => onSuccess?.(),
    onError: (error) => onError?.(error),
    // 실패(CARE_ACTION_STALE · ALREADY_SENT)도 화면 데이터가 오래됐다는 뜻이라 성공 · 실패 모두 다시 불러온다.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
        queryClient.invalidateQueries({ queryKey: careActionKeys.all }),
      ]),
  });
}
