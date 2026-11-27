import { Outlet } from 'react-router';

import { AppSidebar } from '@/widgets/app-sidebar';

import styles from './app-layout.module.css';

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <AppSidebar />
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
