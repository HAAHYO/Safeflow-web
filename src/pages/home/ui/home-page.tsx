import { EMPLOYEE_ROLE_LABEL, useSession } from '@/entities/session';

export function HomePage() {
  const session = useSession();

  return (
    <section>
      <h1>대시보드</h1>
      {session && (
        <p>
          {session.department} {session.username}님, 환영합니다. (
          {EMPLOYEE_ROLE_LABEL[session.role]})
        </p>
      )}
    </section>
  );
}
