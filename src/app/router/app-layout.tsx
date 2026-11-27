import { Outlet } from 'react-router';

import { AppHeader } from '@/widgets/app-header';

import styles from './app-layout.module.css';

export function AppLayout() {
  return (
    <>
      <AppHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}
