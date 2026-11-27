const wonFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });

/** 15000000 → "15,000,000원" */
export function formatWon(amount: number): string {
  return `${wonFormatter.format(amount)}원`;
}

/** 0-1 점수 → "82.0%" */
export function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

/**
 * 백엔드 LocalDateTime 문자열을 그대로 읽어 "2026.11.27 08:30" 으로 바꾼다.
 * 타임존 정보가 없는 KST 값이라 Date 로 바꾸지 않는다(브라우저 타임존에 따라 시각이 밀린다).
 */
export function formatLocalDateTime(value: string): string {
  const [date = '', time = ''] = value.split('T');
  return `${date.replaceAll('-', '.')} ${time.slice(0, 5)}`.trim();
}
