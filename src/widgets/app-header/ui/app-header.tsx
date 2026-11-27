import { Link, NavLink } from 'react-router';

import { EMPLOYEE_ROLE_LABEL, type EmployeeRole, useSession } from '@/entities/session';
import { LogoutButton } from '@/features/auth';

import styles from './app-header.module.css';

type NavItem = { to: string; label: string; roles: EmployeeRole[] };

/** 메뉴는 역할별로 보인다. 백엔드 권한(@PreAuthorize)과 맞춘다. */
const NAV_ITEMS: NavItem[] = [
  { to: '/transactions', label: '거래 내역', roles: ['FDS_ADMIN', 'CRM_MARKETER'] },
];

export function AppHeader() {
  const session = useSession();
  const navItems = session ? NAV_ITEMS.filter((item) => item.roles.includes(session.role)) : [];

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        Safeflow
      </Link>
      {navItems.length > 0 && (
        <nav aria-label="주 메뉴" className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
      <div className={styles.spacer} />
      {session && (
        <>
          <div className={styles.user}>
            <strong>{session.username}</strong>
            <span className={styles.role}>
              {session.department} · {EMPLOYEE_ROLE_LABEL[session.role]}
            </span>
          </div>
          <LogoutButton />
        </>
      )}
    </header>
  );
}
