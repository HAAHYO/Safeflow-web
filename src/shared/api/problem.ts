import axios from 'axios';
import { z } from 'zod';

/** 백엔드 에러 응답(RFC 9457 ProblemDetail + code). */
const problemDetailSchema = z.object({
  status: z.number(),
  detail: z.string().optional(),
  code: z.string().optional(),
});

export type ProblemDetail = z.infer<typeof problemDetailSchema>;

/** 에러에서 ProblemDetail 을 꺼낸다. 백엔드 에러 응답이 아니면 null. */
export function getProblemDetail(error: unknown): ProblemDetail | null {
  if (!axios.isAxiosError(error)) return null;
  const parsed = problemDetailSchema.safeParse(error.response?.data);
  return parsed.success ? parsed.data : null;
}

/** 사용자에게 보여줄 에러 문구. */
export function getErrorMessage(error: unknown): string {
  const problem = getProblemDetail(error);
  if (problem?.detail) return problem.detail;
  if (axios.isAxiosError(error) && !error.response) return '서버에 연결할 수 없습니다.';
  return '알 수 없는 오류가 발생했습니다.';
}
