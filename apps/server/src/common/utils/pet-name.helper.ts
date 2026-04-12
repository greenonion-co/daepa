import { EntityManager } from 'typeorm';

/**
 * 삭제된 펫 이름에서 원래 이름을 추출합니다.
 * 형식: DELETED_{원래이름}_{13자리 타임스탬프}
 *
 * @param name - 펫 이름 (삭제된 형식 또는 일반 이름)
 * @returns 원래 이름 (삭제된 형식이면 추출, 아니면 그대로 반환)
 */
export function extractOriginalPetName(
  name: string | null | undefined,
): string | undefined {
  if (!name) return undefined;

  if (name.startsWith('DELETED_')) {
    const match = name.match(/^DELETED_(.+)_\d{13}$/);
    return match ? match[1] : name;
  }

  return name;
}

/**
 * 소유권 이전 시 매수인의 기존 펫과 이름 충돌을 방지하는 고유 이름을 생성합니다.
 *
 * 충돌이 없으면 원래 이름을 그대로 반환하고,
 * 충돌이 있으면 "(2)", "(3)", ... 접미사를 붙여 고유한 이름을 찾습니다.
 *
 * @param baseName - 원래 펫 이름
 * @param ownerId - 매수인 userId
 * @param em - 트랜잭션 내 EntityManager
 * @returns 충돌 없는 고유 이름
 */
export async function resolveUniqueNameForOwner(
  baseName: string,
  ownerId: string,
  em: EntityManager,
): Promise<string> {
  // 매수인이 보유 중인 같은 이름(또는 접미사 붙은 이름)들을 한 번에 조회
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const existing: { name: string }[] = await em.query(
    `SELECT name FROM pets WHERE owner_id = ? AND is_deleted = false AND (name = ? OR name LIKE ?)`,
    [ownerId, baseName, `${baseName} (%))`],
  );

  if (existing.length === 0) return baseName;

  const existingNames = new Set(existing.map((r) => r.name));
  if (!existingNames.has(baseName)) return baseName;

  // (2), (3), ... 순서로 시도
  for (let i = 2; i <= existingNames.size + 2; i++) {
    const candidate = `${baseName} (${i})`;
    if (!existingNames.has(candidate)) return candidate;
  }

  // fallback: 거의 도달하지 않지만 안전장치
  return `${baseName} (${Date.now()})`;
}
