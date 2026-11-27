import { QueryClient } from '@tanstack/react-query';

/**
 * 앱 전역 QueryClient. 세션이 끊길 때 컴포넌트 바깥(session-sync)에서도 캐시를 지워야 해서
 * Provider 안이 아니라 모듈 싱글턴으로 둔다.
 */
export const queryClient = new QueryClient();
