import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { type Session, useSessionStore } from '@/entities/session';

import { GuestOnly, RequireAuth } from './guards';

const session: Session = {
  accessToken: 'token',
  username: 'crm_marketer',
  role: 'CRM_MARKETER',
  department: '고객관리팀',
  expiresAt: null,
};

function CurrentPath() {
  const { pathname, search, hash } = useLocation();
  return <p>현재 경로 {`${pathname}${search}${hash}`}</p>;
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { element: <GuestOnly />, children: [{ path: '/login', element: <p>로그인 화면</p> }] },
      { element: <RequireAuth />, children: [{ path: '*', element: <CurrentPath /> }] },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('라우트 가드', () => {
  afterEach(() => useSessionStore.getState().clearSession());

  it('로그인하지 않으면 /login 으로 보내며 쿼리스트링 · 해시까지 기억한다', () => {
    const router = renderAt('/cases?id=3#memo');

    expect(screen.getByText('로그인 화면')).toBeInTheDocument();
    expect(router.state.location.state).toEqual({ from: '/cases?id=3#memo' });
  });

  it('로그인에 성공하면 원래 가려던 경로로 보낸다', () => {
    renderAt('/cases?id=3#memo');

    act(() => useSessionStore.getState().setSession(session));

    expect(screen.getByText('현재 경로 /cases?id=3#memo')).toBeInTheDocument();
  });

  it('로그인한 상태로 /login 에 바로 오면 홈으로 보낸다', () => {
    useSessionStore.getState().setSession(session);
    renderAt('/login');

    expect(screen.getByText('현재 경로 /')).toBeInTheDocument();
  });

  it('세션이 지워지면(로그아웃 · 401 · 만료) 로그인 화면으로 바뀐다', () => {
    useSessionStore.getState().setSession(session);
    renderAt('/');

    act(() => useSessionStore.getState().clearSession());

    expect(screen.getByText('로그인 화면')).toBeInTheDocument();
  });
});
