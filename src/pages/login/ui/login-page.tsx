import { LoginForm } from '@/features/auth';
import { isMockMode } from '@/shared/config';
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
          {isMockMode && (
            <aside className={styles.mockHint} aria-label="목 모드 안내">
              <strong>목 모드</strong> · 백엔드 없이 예시 데이터로 동작합니다.
              <br />
              아이디 <code>fds_admin</code>(이상거래탐지) 또는 <code>crm_marketer</code>(CRM),
              비밀번호는 아무 값이나 입력하세요.
            </aside>
          )}
        </section>
      </main>
    </div>
  );
}
