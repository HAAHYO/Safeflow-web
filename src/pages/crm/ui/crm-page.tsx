import { PageHeader } from '@/shared/ui/page-header';
import { HighRiskCustomerList } from '@/widgets/high-risk-customer-list';

export function CrmPage() {
  return (
    <>
      <PageHeader
        title="이탈 위험 고객"
        description="오탐 피해 고객이거나 이탈 점수 60% 이상인 고객입니다. 이탈 점수가 높은 순으로 보여줍니다."
      />
      <HighRiskCustomerList />
    </>
  );
}
