import { useSessionStore } from '@/entities/session';

/**
 * 세션을 지운다. 쿼리 캐시 정리는 app 계층의 session-sync 가,
 * 로그인 화면 이동은 라우트 가드가 맡는다.
 */
export function useLogout() {
  return useSessionStore((state) => state.clearSession);
}
