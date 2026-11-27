import { Navigate, Outlet, useLocation } from 'react-router';

import { type EmployeeRole, useSession } from '@/entities/session';
import { ForbiddenPage } from '@/pages/forbidden';

type FromState = { from?: string } | null;

/** 로그인하지 않았으면 /login 으로 보낸다. 로그인 후 돌아올 경로를 state 로 넘긴다. */
export function RequireAuth() {
  const session = useSession();
  const { pathname, search, hash } = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: `${pathname}${search}${hash}` }} />;
  }
  return <Outlet />;
}

/**
 * 허용된 역할이 아니면 권한 없음 화면을 보여준다. RequireAuth 안쪽에서 쓴다.
 * 화면만 막는 것이고, 실제 권한 검사는 백엔드(@PreAuthorize)가 한다.
 */
export function RequireRole({ roles }: { roles: EmployeeRole[] }) {
  const session = useSession();

  if (!session || !roles.includes(session.role)) return <ForbiddenPage />;
  return <Outlet />;
}

/**
 * 로그인한 상태면 원래 가려던 경로(없으면 홈)로 보낸다.
 * 로그인 성공 후 이동도 여기서 일어난다 — 화면 이동 책임을 가드 한 곳에 둔다.
 */
export function GuestOnly() {
  const session = useSession();
  const location = useLocation();

  if (session) {
    return <Navigate to={(location.state as FromState)?.from ?? '/'} replace />;
  }
  return <Outlet />;
}
