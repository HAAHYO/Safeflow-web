import { z } from 'zod';

export const employeeRoleSchema = z.enum(['FDS_ADMIN', 'CRM_MARKETER']);

export type EmployeeRole = z.infer<typeof employeeRoleSchema>;

export const EMPLOYEE_ROLE_LABEL: Record<EmployeeRole, string> = {
  FDS_ADMIN: '이상거래탐지 관리자',
  CRM_MARKETER: 'CRM 마케터',
};

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  username: z.string().min(1),
  role: employeeRoleSchema,
  department: z.string(),
  /** 토큰 만료 시각(ms). 토큰에서 읽지 못하면 null — 이때는 서버의 401 로만 만료를 안다. */
  expiresAt: z.number().nullable(),
});

export type Session = z.infer<typeof sessionSchema>;

export function isSessionExpired(session: Session, now = Date.now()): boolean {
  return session.expiresAt !== null && session.expiresAt <= now;
}
