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
