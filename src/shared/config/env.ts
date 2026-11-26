import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().min(1),
});

// 앱 시작 시점에 한 번 검증한다. 값이 빠져 있으면 여기서 바로 터진다.
export const env = envSchema.parse(import.meta.env);
