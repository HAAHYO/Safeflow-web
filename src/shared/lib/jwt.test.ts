import { describe, expect, it } from 'vitest';

import { getJwtExpiresAt } from './jwt';

function makeToken(payload: object) {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.signature`;
}

describe('getJwtExpiresAt', () => {
  it('exp(초)를 밀리초로 돌려준다', () => {
    expect(getJwtExpiresAt(makeToken({ exp: 1_700_000_000 }))).toBe(1_700_000_000_000);
  });

  it('exp 가 없거나 형식이 잘못되면 null', () => {
    expect(getJwtExpiresAt(makeToken({ sub: 'a' }))).toBeNull();
    expect(getJwtExpiresAt('not-a-jwt')).toBeNull();
    expect(getJwtExpiresAt('a.%%%.c')).toBeNull();
  });
});
