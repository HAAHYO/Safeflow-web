import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/shared/lib/test';

import { apiClient } from './client';
import { getErrorMessage, getProblemDetail } from './problem';

const API = 'http://localhost:8080';

async function captureError(request: () => Promise<unknown>) {
  try {
    await request();
  } catch (error) {
    return error;
  }
  throw new Error('요청이 실패하지 않았습니다.');
}

describe('getErrorMessage', () => {
  it('ProblemDetail 의 detail 을 보여준다', async () => {
    server.use(
      http.get(`${API}/api/x`, () =>
        HttpResponse.json(
          { status: 409, detail: '잔액이 부족합니다.', code: 'INSUFFICIENT_BALANCE' },
          { status: 409 },
        ),
      ),
    );
    const error = await captureError(() => apiClient.get('/api/x'));

    expect(getErrorMessage(error)).toBe('잔액이 부족합니다.');
    expect(getProblemDetail(error)?.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('응답이 없으면 연결 실패 문구를 보여준다', async () => {
    server.use(http.get(`${API}/api/x`, () => HttpResponse.error()));
    const error = await captureError(() => apiClient.get('/api/x'));

    expect(getErrorMessage(error)).toBe('서버에 연결할 수 없습니다.');
  });

  it('알 수 없는 에러는 기본 문구를 보여준다', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('알 수 없는 오류가 발생했습니다.');
  });
});
