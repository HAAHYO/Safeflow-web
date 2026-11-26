import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/shared/lib/test';

import { apiClient, configureApiClient } from './client';

const API = 'http://localhost:8080';

describe('configureApiClient', () => {
  let release: (() => void) | undefined;
  afterEach(() => release?.());

  it('토큰이 있으면 Authorization 헤더를 붙인다', async () => {
    release = configureApiClient({ getAccessToken: () => 'token-1', onUnauthorized: vi.fn() });
    let authorization: string | null = null;
    server.use(
      http.get(`${API}/api/ping`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({});
      }),
    );

    await apiClient.get('/api/ping');

    expect(authorization).toBe('Bearer token-1');
  });

  it('토큰을 실은 요청이 401 이면 onUnauthorized 를 부른다', async () => {
    const onUnauthorized = vi.fn();
    release = configureApiClient({ getAccessToken: () => 'expired', onUnauthorized });
    server.use(http.get(`${API}/api/ping`, () => HttpResponse.json({}, { status: 401 })));

    await expect(apiClient.get('/api/ping')).rejects.toThrow();

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('토큰 없이 받은 401(로그인 실패)은 세션 만료로 보지 않는다', async () => {
    const onUnauthorized = vi.fn();
    release = configureApiClient({ getAccessToken: () => null, onUnauthorized });
    server.use(http.post(`${API}/api/auth/login`, () => HttpResponse.json({}, { status: 401 })));

    await expect(apiClient.post('/api/auth/login', {})).rejects.toThrow();

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
