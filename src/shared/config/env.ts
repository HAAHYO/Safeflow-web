import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().min(1),
  MODE: z.string(),
});

// 앱 시작 시점에 한 번 검증한다. 값이 빠져 있으면 여기서 바로 터진다.
export const env = envSchema.parse(import.meta.env);

/** `pnpm dev:mock` 으로 띄웠는지. 이때는 백엔드 대신 브라우저의 MSW 가 응답한다. */
export const isMockMode = import.meta.env.MODE === 'mock';
