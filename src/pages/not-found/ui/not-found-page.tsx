import { NoticePage } from '@/shared/ui/notice-page';

export function NotFoundPage() {
  return (
    <NoticePage
      code="404"
      title="페이지를 찾을 수 없습니다"
      description="주소가 바뀌었거나 없는 페이지입니다."
    />
  );
}
