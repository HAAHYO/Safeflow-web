import { Badge, type BadgeTone } from '@/shared/ui/badge';

import { FDS_STATUS_LABEL, type FdsStatus } from '../model/transaction';

const TONE: Record<FdsStatus, BadgeTone> = {
  NORMAL: 'success',
  WARNING: 'warning',
  BLOCKED: 'danger',
};

export function FdsStatusBadge({ status }: { status: FdsStatus }) {
  return <Badge tone={TONE[status]}>{FDS_STATUS_LABEL[status]}</Badge>;
}
