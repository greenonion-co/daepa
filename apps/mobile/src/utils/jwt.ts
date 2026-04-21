/**
 * JWT payload의 `iat` (issued-at) claim을 초 단위로 반환.
 * 토큰이 유효하지 않거나 iat이 없으면 0 반환 (= 가장 오래된 것으로 취급).
 *
 * 서버가 서명 시점에 기록한 값이라 **클라이언트 시계와 무관한 단조 증가 비교 기준**이 됨.
 * Native ↔ WebView 사이 어느 쪽 토큰이 더 최신인지 판단할 때 사용.
 */
export const getJwtIat = (jwt: string | null | undefined): number => {
  if (!jwt || typeof jwt !== 'string') return 0;
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return 0;
    // JWT는 base64url. base64로 변환해 atob로 디코드.
    const payload = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const padding = payload.length % 4 === 0 ? '' : '='.repeat(4 - (payload.length % 4));
    const decoded = atob(payload + padding);
    const { iat } = JSON.parse(decoded) as { iat?: number };
    return typeof iat === 'number' ? iat : 0;
  } catch {
    return 0;
  }
};

/** a가 b보다 같거나 더 최근에 발급된 토큰이면 true */
export const isTokenNewerOrEqual = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => {
  if (!b) return true;
  if (!a) return false;
  return getJwtIat(a) >= getJwtIat(b);
};
