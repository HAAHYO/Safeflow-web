import { LoginForm } from '@/features/auth';
import { Icon } from '@/shared/ui/icon';

import styles from './login-page.module.css';

const HIGHLIGHTS = [
  '실시간 거래 FDS 분석과 탐지 근거',
  '오탐 판정과 피해 고객 자동 케어',
  '이탈 위험 고객 관리',
];

// 로그인에 성공하면 GuestOnly 가드가 원래 가려던 경로로 보낸다.
export function LoginPage() {
  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <Icon name="shield" size={22} />
          </span>
          Safeflow
        </div>
        <div>
          <p className={styles.headline}>
            이상거래는 막고,
            <br />
            고객은 지킵니다.
          </p>
          <ul className={styles.highlights}>
            {HIGHLIGHTS.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
        <p className={styles.footnote}>은행 내부 직원 전용 콘솔</p>
      </aside>
      <main className={styles.formPanel}>
        <section className={styles.card}>
          <h1 className={styles.title}>로그인</h1>
          <p className={styles.description}>직원 계정으로 로그인해 주세요.</p>
          <LoginForm />
        </section>
      </main>
    </div>
  );
}
