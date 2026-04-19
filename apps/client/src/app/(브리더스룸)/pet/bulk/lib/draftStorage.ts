import type { BulkPetRow } from "../hooks/useBulkPetForm";

const STORAGE_KEY = "bulk-pet-draft";
const VERSION = 1;

type DraftPayload = {
  v: number;
  savedAt: number;
  rows: BulkPetRow[];
};

export type Draft = { rows: BulkPetRow[]; savedAt: number };

export function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    if (parsed.v !== VERSION || !Array.isArray(parsed.rows)) return null;
    return { rows: parsed.rows, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function saveDraft(rows: BulkPetRow[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: DraftPayload = { v: VERSION, savedAt: Date.now(), rows };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // 쿼터 초과 등 — 무시
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
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
