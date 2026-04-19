import type { BulkPetRow } from "../hooks/useBulkPetForm";

const STORAGE_PREFIX = "bulk-pet-draft";
const VERSION = 1;

type DraftPayload = {
  v: number;
  savedAt: number;
  rows: BulkPetRow[];
};

export type Draft = { rows: BulkPetRow[]; savedAt: number };

/** 사용자별 namespace 적용 — 공용 PC에서 직전 사용자의 draft가 노출되지 않도록 */
function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function loadDraft(userId: string): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    if (parsed.v !== VERSION || !Array.isArray(parsed.rows)) return null;
    return { rows: parsed.rows, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, rows: BulkPetRow[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: DraftPayload = { v: VERSION, savedAt: Date.now(), rows };
    localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // 쿼터 초과 등 — 무시
  }
}

export function clearDraft(userId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // noop
  }
}

/** 빈 초기 상태(1행 + 기본값)인지 여부. 저장/복원 프롬프트 노출 판단에 사용. */
export function hasMeaningfulContent(rows: BulkPetRow[]): boolean {
  if (rows.length > 1) return true;
  if (rows.length === 0) return false;
  const r = rows[0]!;
  return Boolean(
    r.name ||
      r.hatchingDate ||
      r.sex ||
      r.growth ||
      (r.weight ?? null) !== null ||
      r.adoptionStatus ||
      r.fatherName ||
      r.motherName ||
      r.morphs?.length ||
      r.traits?.length ||
      r.foods?.length ||
      r.images?.length ||
      r.isPublic ||
      r.isBreeder,
  );
}
