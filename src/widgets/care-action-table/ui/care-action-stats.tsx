import { useQuery } from '@tanstack/react-query';

import { StatCard, StatGrid } from '@/shared/ui/stat-card';

import { type CareAction, careActionListQueryOptions } from '../api/care-actions';

/** 케어 조치 요약 수치. 목록과 같은 쿼리(캐시)를 쓴다. */
export function CareActionStats() {
  const { data } = useQuery(careActionListQueryOptions());
  const count = (predicate: (action: CareAction) => boolean) =>
    data ? data.filter(predicate).length.toLocaleString('ko-KR') : '-';

  return (
    <StatGrid label="케어 조치 요약">
      <StatCard label="전체 케어 조치" value={count(() => true)} tone="primary" />
      <StatCard
        label="발송 대기"
        value={count((a) => a.status === 'PENDING')}
        hint="고객에게 아직 안내하지 않음"
        tone="warning"
      />
      <StatCard label="발송 완료" value={count((a) => a.status === 'SENT')} tone="success" />
      <StatCard
        label="오탐 피해 고객 대상"
        value={count((a) => a.isFalsePositiveVictim)}
        hint="정상 거래가 차단된 고객"
        tone="danger"
      />
    </StatGrid>
  );
}
