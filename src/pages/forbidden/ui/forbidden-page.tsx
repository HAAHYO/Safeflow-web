import { NoticePage } from '@/shared/ui/notice-page';

export function ForbiddenPage() {
  return (
    <NoticePage
      code="403"
      title="접근 권한이 없습니다"
      description="이 화면은 담당 역할의 직원만 볼 수 있습니다."
    />
  );
}
