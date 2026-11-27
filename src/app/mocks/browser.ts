import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

/** 목 모드에서만 불린다. 처리하지 않는 요청(폰트 · 정적 파일 등)은 그대로 보낸다. */
export async function startMockWorker() {
  const worker = setupWorker(...handlers);
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true });
}
