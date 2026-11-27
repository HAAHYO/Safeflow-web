import { PageHeader } from '@/shared/ui/page-header';
import { CareActionStats, CareActionTable } from '@/widgets/care-action-table';

export function CareActionsPage() {
  return (
    <>
      <PageHeader
        title="케어 조치"
        description="FDS 주의 · 차단과 오탐 판정으로 생긴 고객 케어 조치와 발송 현황입니다."
      />
      <CareActionStats />
      <CareActionTable />
    </>
  );
}
