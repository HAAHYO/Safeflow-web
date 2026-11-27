import { z } from 'zod';

/**
 * 백엔드 BigDecimal. 보통 JSON 숫자로 오지만 직렬화 설정에 따라 문자열일 수도 있어 둘 다 받는다.
 * 금액 · 점수 표시용이며, 이 값으로 정밀 계산을 하지 않는다.
 */
export const decimalSchema = z
  .union([z.number(), z.string().trim().min(1)])
  .transform(Number)
  .pipe(z.number().finite());

/** 백엔드 LocalDateTime(타임존 없는 KST, 예: 2026-11-27T08:30:00). */
export const localDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/);
