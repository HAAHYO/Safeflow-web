import { describe, expect, it } from 'vitest';

import { formatLocalDateTime, formatScore, formatWon } from './format';

describe('format', () => {
  it('formatWon: 천 단위 구분 + 원', () => {
    expect(formatWon(15_000_000)).toBe('15,000,000원');
    expect(formatWon(1234.5)).toBe('1,234.5원');
  });

  it('formatScore: 0-1 점수를 퍼센트로', () => {
    expect(formatScore(0.82)).toBe('82.0%');
    expect(formatScore(0.0825)).toBe('8.3%');
  });

  it('formatLocalDateTime: 타임존 변환 없이 그대로 표시', () => {
    expect(formatLocalDateTime('2026-11-27T03:05:09')).toBe('2026.11.27 03:05');
    expect(formatLocalDateTime('2026-11-27T23:59:00.123')).toBe('2026.11.27 23:59');
  });
});
