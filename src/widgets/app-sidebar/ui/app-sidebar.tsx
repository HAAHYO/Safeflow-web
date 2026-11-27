import { NavLink } from 'react-router';

import { EMPLOYEE_ROLE_LABEL, type EmployeeRole, useSession } from '@/entities/session';
import { LogoutButton } from '@/features/auth';
import { Icon, type IconName } from '@/shared/ui/icon';

import styles from './app-sidebar.module.css';

type NavItem = { to: string; label: string; icon: IconName; roles: EmployeeRole[] };

/** 메뉴는 역할별로 보인다. 백엔드 권한(@PreAuthorize) · 라우트 가드(app/router)와 맞춘다. */
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '대시보드', icon: 'dashboard', roles: ['FDS_ADMIN', 'CRM_MARKETER'] },
  {
    to: '/transactions',
    label: '거래 내역',
    icon: 'transactions',
    roles: ['FDS_ADMIN', 'CRM_MARKETER'],
  },
  { to: '/crm', label: '이탈 위험 고객', icon: 'users', roles: ['CRM_MARKETER'] },
  {
    to: '/care-actions',
    label: '케어 조치',
    icon: 'send',
    roles: ['FDS_ADMIN', 'CRM_MARKETER'],
  },
];

export function AppSidebar() {
  const session = useSession();
  const navItems = session ? NAV_ITEMS.filter((item) => item.roles.includes(session.role)) : [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>
          <Icon name="shield" size={18} />
        </span>
        Safeflow
      </div>
      <nav aria-label="주 메뉴" className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      {session && (
        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">
            {session.username.slice(0, 1).toUpperCase()}
          </span>
          <div className={styles.userText}>
            <strong>{session.username}</strong>
            <span className={styles.role}>
              {session.department} · {EMPLOYEE_ROLE_LABEL[session.role]}
            </span>
          </div>
          <LogoutButton />
        </div>
      )}
    </aside>
  );
}
