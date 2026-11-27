import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** 목 모드가 아닌 빌드에서는 public/ 에서 복사된 MSW 워커를 지운다. */
function excludeMockWorker(mode: string): Plugin {
  let workerPath = '';
  return {
    name: 'exclude-mock-worker',
    apply: 'build',
    configResolved(config) {
      // outDir 은 root 기준 상대 경로일 수 있어 root 로 풀어 둔다.
      workerPath = resolve(config.root, config.build.outDir, 'mockServiceWorker.js');
    },
    async closeBundle() {
      if (mode === 'mock') return;
      await rm(workerPath, { force: true });
    },
  };
}

/**
 * 필수 환경 변수가 없으면 빌드를 실패시킨다.
 * 앱은 시작할 때 env 를 zod 로 검증하므로, 값이 빠진 채 빌드되면 배포 후 첫 화면부터 깨진다.
 */
function requireBuildEnv(names: string[]): Plugin {
  return {
    name: 'require-build-env',
    apply: 'build',
    configResolved(config) {
      const missing = names.filter((name) => !String(config.env[name] ?? '').trim());
      if (missing.length > 0) {
        throw new Error(
          `빌드에 필요한 환경 변수가 없습니다: ${missing.join(', ')}. ` +
            '.env(.production) 파일이나 배포 환경 변수에 설정해 주세요.',
        );
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), excludeMockWorker(mode), requireBuildEnv(['VITE_API_URL'])],
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
