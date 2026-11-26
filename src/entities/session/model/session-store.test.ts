import { afterEach, describe, expect, it } from 'vitest';

import { type Session } from './session';
import { getAccessToken, useSessionStore } from './session-store';

const session = (expiresAt: number | null): Session => ({
  accessToken: 'token',
  username: 'fds_admin',
  role: 'FDS_ADMIN',
  department: '이상거래탐지팀',
  expiresAt,
});

describe('getAccessToken', () => {
  afterEach(() => useSessionStore.getState().clearSession());

  it('세션이 없으면 null', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('유효한 세션이면 토큰을 돌려준다', () => {
    useSessionStore.getState().setSession(session(Date.now() + 60_000));

    expect(getAccessToken()).toBe('token');
  });

  it('만료된 세션이면 지우고 null', () => {
    useSessionStore.getState().setSession(session(Date.now() - 1));

    expect(getAccessToken()).toBeNull();
    expect(useSessionStore.getState().session).toBeNull();
  });
});
