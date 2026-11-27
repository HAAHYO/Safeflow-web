import { afterEach, describe, expect, it } from 'vitest';

import { type Session } from './session';
import { getAccessToken, useSessionStore } from './session-store';

const STORAGE_KEY = 'safeflow-session';

const session = (expiresAt: number | null): Session => ({
  accessToken: 'token',
  username: 'fds_admin',
  role: 'FDS_ADMIN',
  department: '이상거래탐지팀',
  expiresAt,
});

afterEach(() => {
  useSessionStore.getState().clearSession();
  sessionStorage.clear();
});

describe('getAccessToken', () => {
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

describe('sessionStorage 복원', () => {
  async function rehydrateWith(stored: unknown) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { session: stored }, version: 0 }));
    await useSessionStore.persist.rehydrate();
  }

  it('유효한 세션은 복원한다', async () => {
    await rehydrateWith(session(Date.now() + 60_000));

    expect(useSessionStore.getState().session?.username).toBe('fds_admin');
  });

  it('만료된 세션은 지운다', async () => {
    await rehydrateWith(session(Date.now() - 1));

    expect(useSessionStore.getState().session).toBeNull();
  });

  it('형태가 잘못된 세션은 지운다', async () => {
    await rehydrateWith({ ...session(null), role: 'SUPER_ADMIN' });

    expect(useSessionStore.getState().session).toBeNull();
  });
});
