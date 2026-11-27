import { rm } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** 목 모드가 아닌 빌드에서는 public/ 에서 복사된 MSW 워커를 지운다. */
function excludeMockWorker(mode: string): Plugin {
  let outDir = 'dist';
  return {
    name: 'exclude-mock-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async closeBundle() {
      if (mode === 'mock') return;
      await rm(`${outDir}/mockServiceWorker.js`, { force: true });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), excludeMockWorker(mode)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 백엔드 local 프로필의 CORS 기본 허용 origin 이 http://localhost:3000 이다.
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    // 테스트에서는 .env 대신 고정값을 쓴다. 실제 요청은 MSW 가 가로챈다.
    env: {
      VITE_API_URL: 'http://localhost:8080',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/shared/lib/test/**',
        'src/app/main.tsx',
        'src/app/mocks/browser.ts',
      ],
    },
  },
}));
