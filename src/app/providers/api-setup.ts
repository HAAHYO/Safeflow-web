import { getAccessToken, useSessionStore } from '@/entities/session';
import { configureApiClient } from '@/shared/api';

/** 앱 시작 시 한 번 호출한다. 토큰이 무효(401)면 세션을 지워 라우트 가드가 로그인 화면으로 보낸다. */
export function setupApiClient() {
  return configureApiClient({
    getAccessToken,
    onUnauthorized: () => useSessionStore.getState().clearSession(),
  });
}
