import { EMPLOYEE_ROLE_LABEL, useSession } from '@/entities/session';
import { PageHeader } from '@/shared/ui/page-header';

import { CrmDashboard } from './crm-dashboard';
import { FdsDashboard } from './fds-dashboard';

/** 역할별 대시보드. 오늘 처리할 일을 먼저 보여주고, 각 화면으로 바로 이동할 수 있게 한다. */
export function HomePage() {
  const session = useSession();

  return (
    <>
      <PageHeader
        title="대시보드"
        description={
          session
            ? `${session.department} ${session.username}님, 환영합니다. (${EMPLOYEE_ROLE_LABEL[session.role]})`
            : undefined
        }
      />
      {session?.role === 'FDS_ADMIN' && <FdsDashboard />}
      {session?.role === 'CRM_MARKETER' && <CrmDashboard />}
    </>
  );
}
