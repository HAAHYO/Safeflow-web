import axios from 'axios';

import { env } from '@/shared/config';

/**
 * 백엔드 공용 axios 인스턴스.
 * 슬라이스별 요청 함수(`entities/*\/api`, `features/*\/api`)는 모두 이것을 쓴다.
 */
export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  // XHR 대신 fetch 를 쓴다. MSW(node)는 jsdom 의 XHR 을 가로채지 못해서,
  // 테스트와 실제 환경이 같은 경로로 요청하도록 fetch 로 통일한다.
  adapter: 'fetch',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

type ApiClientOptions = {
  /** 요청마다 붙일 액세스 토큰. 없으면 null. */
  getAccessToken: () => string | null;
  /** 토큰을 실어 보낸 요청이 401 을 받았을 때(만료 · 무효 토큰). */
  onUnauthorized: () => void;
};

/**
 * 인증 동작을 주입한다. shared 는 세션(entities)을 모르므로 app 계층에서 한 번 호출한다.
 * 반환값을 호출하면 인터셉터를 해제한다(테스트용).
 */
export function configureApiClient({ getAccessToken, onUnauthorized }: ApiClientOptions) {
  const requestId = apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  const responseId = apiClient.interceptors.response.use(undefined, (error: unknown) => {
    // 로그인 실패(토큰 없이 보낸 요청의 401)는 세션 만료가 아니므로 건드리지 않는다.
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.headers.has('Authorization')
    ) {
      onUnauthorized();
    }
    return Promise.reject(error);
  });

  return () => {
    apiClient.interceptors.request.eject(requestId);
    apiClient.interceptors.response.eject(responseId);
  };
}
