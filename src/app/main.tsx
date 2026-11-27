import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppProviders, queryClient, setupApiClient, setupSessionSync } from './providers';
import { AppRouter } from './router';

async function bootstrap() {
  // 목 모드면 첫 요청 전에 MSW 를 띄운다.
  // MODE 를 직접 비교해야 빌드 때 상수로 치환돼 목 코드가 번들에서 통째로 빠진다.
  if (import.meta.env.MODE === 'mock') {
    const { startMockWorker } = await import('./mocks/browser');
    await startMockWorker();
  }

  setupApiClient();
  setupSessionSync(queryClient);

  const root = document.getElementById('root');
  if (!root) throw new Error('#root 엘리먼트를 찾을 수 없습니다.');

  createRoot(root).render(
    <StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </StrictMode>,
  );
}

void bootstrap();
