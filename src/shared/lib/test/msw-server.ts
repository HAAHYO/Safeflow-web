import { setupServer } from 'msw/node';

/**
 * 테스트 전역 MSW 서버. 기본 핸들러는 없다.
 * 테스트마다 `server.use(http.get(...))` 로 필요한 응답만 정의한다.
 */
export const server = setupServer();
