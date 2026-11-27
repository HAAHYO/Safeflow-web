import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type Session, useSessionStore } from '@/entities/session';

import { setupSessionSync } from './session-sync';

const session = (expiresAt: number | null): Session => ({
  accessToken: 'token',
  username: 'fds_admin',
  role: 'FDS_ADMIN',
  department: '이상거래탐지팀',
  expiresAt,
});

describe('setupSessionSync', () => {
  let queryClient: QueryClient;
  let release: () => void;

  beforeEach(() => {
    queryClient = new QueryClient();
    release = setupSessionSync(queryClient);
  });

  afterEach(() => {
    release();
    useSessionStore.getState().clearSession();
    vi.useRealTimers();
  });

  it('세션이 끊기면 쿼리 캐시를 지운다', () => {
    useSessionStore.getState().setSession(session(null));
    queryClient.setQueryData(['transactions'], ['이전 사용자 데이터']);

    useSessionStore.getState().clearSession();

    expect(queryClient.getQueryData(['transactions'])).toBeUndefined();
  });

  it('토큰 만료 시각에 세션을 지운다', () => {
    vi.useFakeTimers();
    useSessionStore.getState().setSession(session(Date.now() + 60_000));

    vi.advanceTimersByTime(59_999);
    expect(useSessionStore.getState().session).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(useSessionStore.getState().session).toBeNull();
  });

  it('만료 시각을 모르면 타이머를 걸지 않는다', () => {
    vi.useFakeTimers();
    useSessionStore.getState().setSession(session(null));

    vi.advanceTimersByTime(24 * 60 * 60 * 1000);

    expect(useSessionStore.getState().session).not.toBeNull();
  });
});
