import { z } from 'zod';

import { employeeRoleSchema } from '@/entities/session';
import { apiClient } from '@/shared/api';

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  role: employeeRoleSchema,
  department: z.string(),
});

export type LoginRequest = { username: string; password: string };
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post('/api/auth/login', request);
  return loginResponseSchema.parse(data);
}
