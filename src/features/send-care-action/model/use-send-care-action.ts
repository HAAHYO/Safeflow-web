import { useMutation, useQueryClient } from '@tanstack/react-query';

import { careActionKeys } from '@/entities/care-action';
import { customerKeys } from '@/entities/customer';

import { sendCareAction, type SendCareActionRequest } from '../api/send-care-action';

export function useSendCareAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendCareActionRequest) => sendCareAction(request),
    // 실패(CARE_ACTION_STALE · ALREADY_SENT)도 화면 데이터가 오래됐다는 뜻이라 성공 · 실패 모두 다시 불러온다.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
        queryClient.invalidateQueries({ queryKey: careActionKeys.all }),
      ]),
  });
}
