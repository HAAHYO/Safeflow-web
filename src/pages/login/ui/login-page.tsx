import { LoginForm } from '@/features/auth';
import { isMockMode } from '@/shared/config';
import { Icon, type IconName } from '@/shared/ui/icon';

import styles from './login-page.module.css';

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'transactions',
    title: '실시간 이상거래 탐지',
    text: '거래마다 사기 점수와 탐지 근거를 바로 확인합니다.',
  },
  {
    icon: 'shield',
    title: '오탐 판정과 피해 고객 케어',
    text: '잘못 차단된 고객에게 보상 안내를 이어서 보냅니다.',
  },
  {
    icon: 'users',
    title: '이탈 위험 고객 관리',
    text: '이탈 점수가 높은 고객을 먼저 챙깁니다.',
  },
];

// 로그인에 성공하면 GuestOnly 가드가 원래 가려던 경로로 보낸다.
export function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <aside className={styles.brandPanel}>
          <div className={styles.brand}>
            <span className={styles.logo}>
              <Icon name="shield" size={20} />
            </span>
            Safeflow
          </div>
          <p className={styles.headline}>
            이상거래는 막고,
            <br />
            고객은 지킵니다.
          </p>
          <ul className={styles.features}>
            {FEATURES.map((feature) => (
              <li key={feature.title} className={styles.feature}>
                <span className={styles.featureIcon}>
                  <Icon name={feature.icon} size={16} />
                </span>
                <div>
                  <p className={styles.featureTitle}>{feature.title}</p>
                  <p className={styles.featureText}>{feature.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className={styles.footnote}>은행 내부 직원 전용 콘솔</p>
        </aside>
        <main className={styles.formPanel}>
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
        </main>
      </div>
    </div>
  );
}
