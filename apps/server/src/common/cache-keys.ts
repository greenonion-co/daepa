/** 기본 TTL: 30일 (안전망 — 수동 무효화가 주 전략) */
const DEFAULT_TTL = 30 * 24 * 60 * 60 * 1000;

/** 목록 TTL: 3분 (패턴 무효화 누락 대비) */
const LIST_TTL = 3 * 60 * 1000;

export const CACHE = {
  // ── 1:1 매핑 (30일 TTL + 수동 무효화) ──
  pet: {
    key: (petId: string) => `pet:${petId}`,
    ttl: DEFAULT_TTL,
  },
  thumbnail: {
    key: (petId: string) => `thumb:${petId}`,
    ttl: DEFAULT_TTL,
  },
  familyTree: {
    key: (petId: string, depth = 5, ancestorDepth = 2) =>
      `ftree:${petId}:${depth}:${ancestorDepth}`,
    pattern: (petId: string) => `ftree:${petId}:*`,
    ttl: DEFAULT_TTL,
  },
  pairDetail: {
    key: (pairId: string) => `pair:${pairId}`,
    ttl: DEFAULT_TTL,
  },
  pairStats: {
    key: (userId: string, filterHash: string) =>
      `pair-stats:${userId}:${filterHash}`,
    pattern: (userId: string) => `pair-stats:${userId}:*`,
    ttl: DEFAULT_TTL,
  },
  adoptionStats: {
    key: (userId: string, filterHash: string) =>
      `adopt-stats:${userId}:${filterHash}`,
    pattern: (userId: string) => `adopt-stats:${userId}:*`,
    ttl: DEFAULT_TTL,
  },
  petAdoption: {
    key: (petId: string) => `pet-adopt:${petId}`,
    ttl: DEFAULT_TTL,
  },
  parents: {
    key: (petId: string) => `parents:${petId}`,
    ttl: DEFAULT_TTL,
  },
  profile: {
    key: (name: string) => `profile:${name}`,
    ttl: DEFAULT_TTL,
  },
  children: {
    key: (petId: string, page: number) => `children:${petId}:${page}`,
    pattern: (petId: string) => `children:${petId}:*`,
    ttl: DEFAULT_TTL,
  },
  siblings: {
    key: (petId: string, page: number) => `siblings:${petId}:${page}`,
    pattern: (petId: string) => `siblings:${petId}:*`,
    ttl: DEFAULT_TTL,
  },
  clutchMates: {
    key: (petId: string) => `clutch:${petId}`,
    ttl: DEFAULT_TTL,
  },

  // ── 조합/목록 (3분 TTL + 패턴 무효화) ──
  feed: {
    key: (filterHash: string) => `feed:${filterHash}`,
    pattern: 'feed:*',
    ttl: LIST_TTL,
  },
  myPets: {
    key: (userId: string, filterHash: string) =>
      `my-pets:${userId}:${filterHash}`,
    pattern: (userId: string) => `my-pets:${userId}:*`,
    ttl: LIST_TTL,
  },
  pairList: {
    key: (userId: string, filterHash: string) =>
      `pair-list:${userId}:${filterHash}`,
    pattern: (userId: string) => `pair-list:${userId}:*`,
    ttl: LIST_TTL,
  },
} as const;
