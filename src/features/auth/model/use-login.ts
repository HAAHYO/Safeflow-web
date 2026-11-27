import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { type Session, useSessionStore } from '@/entities/session';
import { getJwtExpiresAt } from '@/shared/lib/jwt';

import { login, type LoginRequest } from '../api/login';

/**
 * 로그인 mutation.
 *
 * React Query 는 mutate 에 넘긴 값을 mutation 의 `variables` 로 계속 들고 있다.
 * 비밀번호가 메모리(캐시 · Devtools)에 평문으로 남지 않도록 variables 에는 아이디만 넣고,
 * 비밀번호는 ref 로 요청 함수에 한 번만 넘긴 뒤 바로 지운다.
 */
export function useLogin({ onSuccess }: { onSuccess?: (session: Session) => void } = {}) {
  const setSession = useSessionStore((state) => state.setSession);
  const passwordRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ username }: Pick<LoginRequest, 'username'>) => {
      const password = passwordRef.current ?? '';
      passwordRef.current = null;
      return login({ username, password });
    },
    onSuccess: (response, { username }) => {
      const session: Session = {
        ...response,
        username,
        expiresAt: getJwtExpiresAt(response.accessToken),
      };
      setSession(session);
      onSuccess?.(session);
    },
  });

  const { mutate } = mutation;
  const submit = useCallback(
    ({ username, password }: LoginRequest) => {
      passwordRef.current = password;
      mutate({ username });
    },
    [mutate],
  );

  return { ...mutation, submit };
}
