import { type Transaction } from '@/entities/transaction';

/** 백엔드 FdsStatus.of 의 임계값과 같다. 점수 막대 색에 쓴다. */
export const FDS_WARNING_THRESHOLD = 0.5;
export const FDS_BLOCK_THRESHOLD = 0.8;

/** 차단됐지만 아직 사기 · 오탐 판정이 나지 않은 거래. FDS_ADMIN 이 오탐 판정할 수 있다. */
export function isAwaitingJudgement(tx: Transaction) {
  return tx.fdsStatus === 'BLOCKED' && tx.isActualFraud === null;
}
