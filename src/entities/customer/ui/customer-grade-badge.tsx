import { Badge, type BadgeTone } from '@/shared/ui/badge';

import { CUSTOMER_GRADE_LABEL, type CustomerGrade } from '../model/customer';

const TONE: Record<CustomerGrade, BadgeTone> = {
  VIP: 'warning',
  GOLD: 'warning',
  GENERAL: 'neutral',
};

export function CustomerGradeBadge({ grade }: { grade: CustomerGrade }) {
  return <Badge tone={TONE[grade]}>{CUSTOMER_GRADE_LABEL[grade]}</Badge>;
}
