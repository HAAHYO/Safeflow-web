import { type QueryClient } from '@tanstack/react-query';

import { type Session, useSessionStore } from '@/entities/session';

/**
 * 세션 수명에 맞춰 부수 효과를 한 곳에서 처리한다.
 * - 세션이 끊기면(로그아웃 · 401 · 만료) 쿼리 캐시를 지운다. 다른 직원이 같은 탭에서
 *   로그인했을 때 이전 사용자의 데이터가 보이지 않게 한다.
 * - 토큰 만료 시각에 세션을 지운다. 백엔드에 refresh 가 없어서 만료되면 다시 로그인해야 한다.
 *
 * 반환값을 호출하면 구독과 타이머를 해제한다.
 */
export function setupSessionSync(queryClient: QueryClient) {
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;

  const scheduleExpiry = (session: Session | null) => {
    clearTimeout(expiryTimer);
    expiryTimer = undefined;
    if (session?.expiresAt == null) return;

    expiryTimer = setTimeout(
      () => useSessionStore.getState().clearSession(),
      Math.max(0, session.expiresAt - Date.now()),
    );
  };

  scheduleExpiry(useSessionStore.getState().session);

  const unsubscribe = useSessionStore.subscribe((state, previous) => {
    if (state.session === previous.session) return;
    if (!state.session) queryClient.clear();
    scheduleExpiry(state.session);
  });

  return () => {
    unsubscribe();
    clearTimeout(expiryTimer);
  };
}
