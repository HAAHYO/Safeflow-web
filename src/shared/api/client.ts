import axios from 'axios';

import { env } from '@/shared/config';

/**
 * 백엔드 공용 axios 인스턴스.
 * 슬라이스별 요청 함수(`entities/*\/api`, `features/*\/api`)는 모두 이것을 쓴다.
 * 인증 헤더 · 토큰 갱신 · 공통 에러 처리는 여기 인터셉터에 붙인다.
 */
export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  // XHR 대신 fetch 를 쓴다. MSW(node)는 jsdom 의 XHR 을 가로채지 못해서,
  // 테스트와 실제 환경이 같은 경로로 요청하도록 fetch 로 통일한다.
  adapter: 'fetch',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});
