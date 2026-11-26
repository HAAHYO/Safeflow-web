/**
 * JWT payload 의 exp 를 밀리초 타임스탬프로 꺼낸다. 서명은 검증하지 않는다(서버가 한다).
 * 형식이 잘못됐거나 exp 가 없으면 null.
 */
export function getJwtExpiresAt(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const json: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (
      typeof json === 'object' &&
      json !== null &&
      'exp' in json &&
      typeof json.exp === 'number'
    ) {
      return json.exp * 1000;
    }
    return null;
  } catch {
    return null;
  }
}
