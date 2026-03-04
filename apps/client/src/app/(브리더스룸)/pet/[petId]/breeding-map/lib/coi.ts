import { petControllerGetParentsByPetId } from "@repo/api-client";
import { AxiosError } from "axios";

// --- Constants ---

/** COI 위험도 임계값 (Wright coefficient) */
const COI_THRESHOLD_CAUTION = 0.0625; // 6.25% — 사촌 수준
const COI_THRESHOLD_WARNING = 0.125; // 12.5% — 반형제 수준
const COI_THRESHOLD_DANGER = 0.25; // 25% — 형제/부모-자식 수준

// --- Types ---

export interface PedigreeEntry {
  fatherId?: string;
  motherId?: string;
  name?: string;
}

export type Pedigree = Map<string, PedigreeEntry>;

export type CoiLevel = "safe" | "caution" | "warning" | "danger";

/** 공통 조상별 기여도 */
export interface CommonAncestorDetail {
  petId: string;
  name?: string;
  contribution: number; // 해당 조상의 COI 기여도 (0~1)
  minGeneration: number; // 가장 가까운 경로의 세대 수
  pathsFromA: string[][]; // petA → 이 조상까지의 모든 경로
  pathsFromB: string[][]; // petB → 이 조상까지의 모든 경로
}

/** COI 계산 상세 결과 */
export interface CoiResult {
  coi: number;
  level: CoiLevel;
  commonAncestors: CommonAncestorDetail[];
  equivalentRelation: string;
}

// --- Pedigree 구축 ---

/** API에서 재귀적으로 조상 정보를 가져와 Pedigree 구축 (최대 maxGen 세대) */
export async function buildPedigree(
  petIds: string[],
  maxGen = 5,
): Promise<Pedigree> {
  const pedigree: Pedigree = new Map();
  const visited = new Set<string>();

  async function fetchAncestors(id: string, gen: number) {
    if (gen > maxGen || visited.has(id)) return;
    visited.add(id);

    try {
      const res = await petControllerGetParentsByPetId(id, {
        statuses: ["approved"],
      });
      const { father, mother } = res.data.data;

      let fatherId: string | undefined;
      let fatherName: string | undefined;
      let motherId: string | undefined;
      let motherName: string | undefined;

      // PetParentDto는 status 필드가 있고, PetHiddenStatusDto는 hiddenStatus 필드가 있음
      if (father && !("hiddenStatus" in father)) {
        fatherId = father.petId;
        fatherName = father.name;
      }
      if (mother && !("hiddenStatus" in mother)) {
        motherId = mother.petId;
        motherName = mother.name;
      }

      const existing = pedigree.get(id);
      pedigree.set(id, { fatherId, motherId, name: existing?.name });
      // 부모 이름도 미리 기록 (아직 방문 전이라도)
      if (fatherId && !pedigree.has(fatherId)) {
        pedigree.set(fatherId, { name: fatherName });
      } else if (fatherId) {
        const existing = pedigree.get(fatherId)!;
        if (!existing.name && fatherName) existing.name = fatherName;
      }
      if (motherId && !pedigree.has(motherId)) {
        pedigree.set(motherId, { name: motherName });
      } else if (motherId) {
        const existing = pedigree.get(motherId)!;
        if (!existing.name && motherName) existing.name = motherName;
      }

      // 다음 세대 재귀
      const nextGen = gen + 1;
      const promises: Promise<void>[] = [];
      if (fatherId) promises.push(fetchAncestors(fatherId, nextGen));
      if (motherId) promises.push(fetchAncestors(motherId, nextGen));
      await Promise.all(promises);
    } catch (error) {
      // 404 등 데이터 없음 → leaf로 처리, 네트워크 에러는 경고 로그
      pedigree.set(id, {});
      if (error instanceof AxiosError && error.response?.status && error.response.status < 500) {
        // 4xx: 부모 정보 없음 — 정상적인 leaf
      } else {
        console.warn(`[COI] Failed to fetch parents for ${id}:`, error);
      }
    }
  }

  await Promise.all(petIds.map((id) => fetchAncestors(id, 1)));
  return pedigree;
}

// --- COI 계산 (Wright 경로 공식) ---

/** 특정 개체에서 조상까지의 모든 경로를 찾음 */
function findAllPaths(
  from: string,
  to: string,
  pedigree: Pedigree,
  visited: Set<string> = new Set(),
): string[][] {
  if (from === to) return [[from]];
  if (visited.has(from)) return [];

  const entry = pedigree.get(from);
  if (!entry) return [];

  visited.add(from);
  const paths: string[][] = [];

  for (const parentId of [entry.fatherId, entry.motherId]) {
    if (!parentId) continue;
    const subPaths = findAllPaths(parentId, to, pedigree, new Set(visited));
    for (const p of subPaths) {
      paths.push([from, ...p]);
    }
  }

  return paths;
}

/** 모든 조상 집합 구하기 */
function getAllAncestors(id: string, pedigree: Pedigree): Set<string> {
  const ancestors = new Set<string>();
  const queue = [id];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const entry = pedigree.get(current);
    if (!entry) continue;

    for (const parentId of [entry.fatherId, entry.motherId]) {
      if (parentId && !ancestors.has(parentId)) {
        ancestors.add(parentId);
        queue.push(parentId);
      }
    }
  }

  return ancestors;
}

/**
 * Wright 경로 공식으로 COI 계산 (상세 결과 반환)
 * 두 개체 A, B를 부모로 하는 가상 자식의 근친계수
 */
export function calculateCOI(
  petIdA: string,
  petIdB: string,
  pedigree: Pedigree,
): CoiResult {
  return calculateCOIWithCache(petIdA, petIdB, pedigree, new Map(), new Map());
}

/** 캐시 기반 내부 COI 계산 */
function calculateCOIWithCache(
  petIdA: string,
  petIdB: string,
  pedigree: Pedigree,
  pathCache: Map<string, string[][]>,
  faCache: Map<string, number>,
): CoiResult {
  // 공통 조상 찾기 (자신도 포함 — 부모×자식 등에서 부모 자신이 공통 조상이 됨)
  const ancestorsA = getAllAncestors(petIdA, pedigree);
  ancestorsA.add(petIdA);
  const ancestorsB = getAllAncestors(petIdB, pedigree);
  ancestorsB.add(petIdB);
  const commonAncestorIds = [...ancestorsA].filter((a) => ancestorsB.has(a));

  if (commonAncestorIds.length === 0) {
    return { coi: 0, level: "safe", commonAncestors: [], equivalentRelation: getEquivalentRelation(0) };
  }

  let totalCoi = 0;
  const details: CommonAncestorDetail[] = [];

  for (const ca of commonAncestorIds) {
    const pathsA = findAllPathsCached(petIdA, ca, pedigree, pathCache);
    const pathsB = findAllPathsCached(petIdB, ca, pedigree, pathCache);
    const fa = cachedAncestorInbreeding(ca, pedigree, faCache, pathCache);

    let contribution = 0;
    let minGen = Infinity;

    for (const pA of pathsA) {
      for (const pB of pathsB) {
        const pASet = new Set(pA.slice(0, -1));
        const pBWithoutCA = pB.slice(0, -1);
        if (pBWithoutCA.some((id) => pASet.has(id))) continue;

        const n1 = pA.length - 1;
        const n2 = pB.length - 1;
        const c = Math.pow(0.5, n1 + n2 + 1) * (1 + fa);
        contribution += c;
        minGen = Math.min(minGen, Math.min(n1, n2));
      }
    }

    if (contribution > 0) {
      details.push({
        petId: ca,
        name: pedigree.get(ca)?.name,
        contribution,
        minGeneration: minGen === Infinity ? 0 : minGen,
        pathsFromA: pathsA,
        pathsFromB: pathsB,
      });
      totalCoi += contribution;
    }
  }

  // 기여도 순으로 정렬
  details.sort((a, b) => b.contribution - a.contribution);

  return {
    coi: totalCoi,
    level: getCoiLevel(totalCoi),
    commonAncestors: details,
    equivalentRelation: getEquivalentRelation(totalCoi),
  };
}

/** findAllPaths 결과 캐시 (같은 from→to 쌍은 pedigree 변경 없으면 동일 결과) */
function findAllPathsCached(
  from: string,
  to: string,
  pedigree: Pedigree,
  cache: Map<string, string[][]>,
): string[][] {
  const key = `${from}→${to}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const result = findAllPaths(from, to, pedigree);
  cache.set(key, result);
  return result;
}

/** 조상 근친계수 캐시 (재귀 중복 방지) */
function cachedAncestorInbreeding(
  id: string,
  pedigree: Pedigree,
  faCache: Map<string, number>,
  pathCache: Map<string, string[][]>,
): number {
  const cached = faCache.get(id);
  if (cached !== undefined) return cached;
  const entry = pedigree.get(id);
  if (!entry?.fatherId || !entry?.motherId) {
    faCache.set(id, 0);
    return 0;
  }
  const result = calculateCOIWithCache(entry.fatherId, entry.motherId, pedigree, pathCache, faCache).coi;
  faCache.set(id, result);
  return result;
}

/** COI → 대표 관계 예시 매칭 */
function getEquivalentRelation(coi: number): string {
  if (coi <= 0) return "무관";
  if (coi < 0.02) return "먼 친척";
  if (coi < 0.04) return "재종사촌 수준";
  if (coi < 0.0625) return "사촌 수준";
  if (coi < 0.1) return "반형제 수준";
  if (coi < 0.2) return "삼촌-조카 수준";
  if (coi < 0.3) return "형제 / 부모-자식 수준";
  return "극근친 수준";
}

// --- 위험도 ---

export function getCoiLevel(coi: number): CoiLevel {
  if (coi < COI_THRESHOLD_CAUTION) return "safe";
  if (coi < COI_THRESHOLD_WARNING) return "caution";
  if (coi < COI_THRESHOLD_DANGER) return "warning";
  return "danger";
}

export const COI_LEVEL_CONFIG: Record<
  CoiLevel,
  { label: string; color: string; darkColor: string; bgColor: string; darkBgColor: string; description: string }
> = {
  safe: {
    label: "안전",
    color: "#15803d",
    darkColor: "#4ade80",
    bgColor: "#f0fdf4",
    darkBgColor: "#14532d",
    description: "유전적 다양성 충분",
  },
  caution: {
    label: "주의",
    color: "#a16207",
    darkColor: "#fbbf24",
    bgColor: "#fefce8",
    darkBgColor: "#422006",
    description: "약간의 유전적 중복",
  },
  warning: {
    label: "경고",
    color: "#c2410c",
    darkColor: "#fb923c",
    bgColor: "#fff7ed",
    darkBgColor: "#431407",
    description: "유전적 다양성 감소",
  },
  danger: {
    label: "위험",
    color: "#dc2626",
    darkColor: "#f87171",
    bgColor: "#fef2f2",
    darkBgColor: "#450a0a",
    description: "근친교배 위험 높음",
  },
};
