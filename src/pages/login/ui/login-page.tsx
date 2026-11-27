import { useLocation, useNavigate } from 'react-router';

import { LoginForm } from '@/features/auth';

import styles from './login-page.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Safeflow</h1>
        <p className={styles.description}>이상거래 탐지 · 고객 케어 콘솔</p>
        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
      </section>
    </div>
  );
}
