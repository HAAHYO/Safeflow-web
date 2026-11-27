import { LoginForm } from '@/features/auth';

import styles from './login-page.module.css';

// 로그인에 성공하면 GuestOnly 가드가 원래 가려던 경로로 보낸다.
export function LoginPage() {
  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Safeflow</h1>
        <p className={styles.description}>이상거래 탐지 · 고객 케어 콘솔</p>
        <LoginForm />
      </section>
    </div>
  );
}
