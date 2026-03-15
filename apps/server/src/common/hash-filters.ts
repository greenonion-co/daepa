import { createHash } from 'crypto';

/**
 * 필터 객체를 짧은 해시 문자열로 변환.
 * 목록/통계 API의 캐시 키에 사용.
 *
 * @example
 * hashFilters({ filterType: 'ALL', page: 1, keyword: '' }) // → "a3f2b1c4"
 */
export function hashFilters(filters: Record<string, any>): string {
  const sorted = JSON.stringify(filters, Object.keys(filters).sort());
  return createHash('md5').update(sorted).digest('hex').slice(0, 8);
}
