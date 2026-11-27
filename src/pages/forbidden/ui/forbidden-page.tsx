import { Link } from 'react-router';

export function ForbiddenPage() {
  return (
    <section>
      <h1>접근 권한이 없습니다</h1>
      <p>이 화면은 담당 역할의 직원만 볼 수 있습니다.</p>
      <Link to="/">홈으로</Link>
    </section>
  );
}
