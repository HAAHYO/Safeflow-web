import { Badge } from '@/shared/ui/badge';

import { CARE_ACTION_STATUS_LABEL, type CareActionStatus } from '../model/care-action';

export function CareActionStatusBadge({ status }: { status: CareActionStatus }) {
  return (
    <Badge tone={status === 'SENT' ? 'success' : 'warning'} dot>
      {CARE_ACTION_STATUS_LABEL[status]}
    </Badge>
  );
}
