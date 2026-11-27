/**
 * 고객 관련 쿼리 key. 고위험 고객 목록의 조회 함수는 여러 엔티티(고객 · 케어 조치 · 거래)를
 * 조합하므로 widget 에 있지만, 다른 기능이 무효화할 수 있도록 key 는 여기에 둔다.
 */
export const customerKeys = {
  all: ['customer'] as const,
  highRisk: () => [...customerKeys.all, 'high-risk'] as const,
};
