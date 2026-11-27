import { Link } from 'react-router';

import { EMPLOYEE_ROLE_LABEL, useSession } from '@/entities/session';
import { LogoutButton } from '@/features/auth';

import styles from './app-header.module.css';

export function AppHeader() {
  const session = useSession();

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        Safeflow
      </Link>
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
