import { useMutation } from '@tanstack/react-query';

import { type Session, useSessionStore } from '@/entities/session';
import { getJwtExpiresAt } from '@/shared/lib/jwt';

import { login, type LoginRequest } from '../api/login';

export function useLogin({ onSuccess }: { onSuccess?: (session: Session) => void } = {}) {
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
    onSuccess: (response, request) => {
      const session: Session = {
        ...response,
        username: request.username,
        expiresAt: getJwtExpiresAt(response.accessToken),
      };
      setSession(session);
      onSuccess?.(session);
    },
  });
}
