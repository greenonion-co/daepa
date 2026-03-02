/**
 * 파충류 모프/형질 유전 예측
 * 현재 크레스티드 게코(CR) 전용 멘델 유전 규칙 지원
 */

// --- Types ---

type InheritanceType = "codominant" | "recessive";

interface GeneRule {
  type: InheritanceType;
  /** 슈퍼폼 이름 (공우성 호모접합) */
  superForm?: string;
  /** 슈퍼폼이 치사인지 */
  lethalSuper?: boolean;
}

/** 개체의 특정 유전자 상태 */
type GeneStatus =
  | "visual"      // 호모(열성) 또는 최소 1카피(공우성)
  | "super"       // 호모 공우성
  | "het100"      // 100% 헷 (1카피 확정)
  | "het66"       // 66% 헷
  | "het50"       // 50% 헷
  | "none";       // 미보유

/** 유전자별 예측 결과 */
export interface GenePrediction {
  gene: string;
  type: InheritanceType;
  parentA: GeneStatus;
  parentB: GeneStatus;
  outcomes: { label: string; probability: number }[];
}

export interface OffspringPrediction {
  genes: GenePrediction[];
}

// --- CR 유전 규칙 ---

const CR_GENE_RULES: Record<string, GeneRule> = {
  릴리화이트: { type: "codominant", lethalSuper: true },
  카푸치노: { type: "codominant", superForm: "슈퍼카푸치노" },
  세이블: { type: "codominant", superForm: "슈퍼세이블" },
  아잔틱: { type: "recessive" },
  초초: { type: "recessive" },
};

/** 콤보 모프 → 구성 유전자 매핑 */
const CR_COMBO_MAP: Record<string, string[]> = {
  릴잔틱: ["릴리화이트", "아잔틱"],
  릴리세이블: ["릴리화이트", "세이블"],
  릴리초초: ["릴리화이트", "초초"],
  카푸아잔틱: ["카푸치노", "아잔틱"],
  세이블아잔틱: ["세이블", "아잔틱"],
  슈퍼세이블릴리: ["세이블", "릴리화이트"], // 슈퍼세이블+릴리
  루왁릴리: ["루왁", "릴리화이트"],
};

/** 슈퍼폼 → 기본 유전자 역매핑 */
const CR_SUPER_TO_BASE: Record<string, string> = {
  슈퍼카푸치노: "카푸치노",
  슈퍼세이블: "세이블",
};

// --- 모프 파싱 ---

/** 모프 문자열 배열에서 유전자별 상태 추출 */
function parseMorphsToGeneMap(morphs: string[]): Map<string, GeneStatus> {
  const geneMap = new Map<string, GeneStatus>();

  for (const morph of morphs) {
    // 헷 패턴: "100%헷아잔틱", "66%헷초초" 등
    const hetMatch = morph.match(/^(\d+)%헷(.+)$/);
    if (hetMatch?.[1] && hetMatch[2]) {
      const pct = parseInt(hetMatch[1]);
      const gene = hetMatch[2];
      if (gene in CR_GENE_RULES) {
        const status: GeneStatus =
          pct >= 100 ? "het100" : pct >= 66 ? "het66" : "het50";
        // 더 확실한 상태가 이미 있으면 유지
        const existing = geneMap.get(gene);
        if (!existing || statusRank(status) > statusRank(existing)) {
          geneMap.set(gene, status);
        }
      }
      continue;
    }

    // 슈퍼폼: "슈퍼카푸치노", "슈퍼세이블"
    if (CR_SUPER_TO_BASE[morph]) {
      geneMap.set(CR_SUPER_TO_BASE[morph], "super");
      continue;
    }

    // 콤보 모프: "릴잔틱" → ["릴리화이트", "아잔틱"]
    if (CR_COMBO_MAP[morph]) {
      for (const gene of CR_COMBO_MAP[morph]) {
        if (CR_GENE_RULES[gene]) {
          const existing = geneMap.get(gene);
          if (!existing || statusRank("visual") > statusRank(existing)) {
            geneMap.set(gene, "visual");
          }
        }
      }
      continue;
    }

    // 단일 유전자: "릴리화이트", "아잔틱" 등
    if (CR_GENE_RULES[morph]) {
      const existing = geneMap.get(morph);
      if (!existing || statusRank("visual") > statusRank(existing)) {
        geneMap.set(morph, "visual");
      }
    }
  }

  return geneMap;
}

function statusRank(s: GeneStatus): number {
  switch (s) {
    case "super": return 5;
    case "visual": return 4;
    case "het100": return 3;
    case "het66": return 2;
    case "het50": return 1;
    case "none": return 0;
  }
}

// --- 교배 예측 ---

/** 두 부모의 특정 유전자에 대한 자식 비율 계산 */
function crossGene(
  gene: string,
  rule: GeneRule,
  statusA: GeneStatus,
  statusB: GeneStatus,
): { label: string; probability: number }[] {
  if (rule.type === "codominant") {
    return crossCodominant(gene, rule, statusA, statusB);
  }
  return crossRecessive(gene, statusA, statusB);
}

function crossCodominant(
  gene: string,
  rule: GeneRule,
  a: GeneStatus,
  b: GeneStatus,
): { label: string; probability: number }[] {
  // 공우성: 0카피=노멀, 1카피=비주얼, 2카피=슈퍼
  const copiesA = a === "super" ? 2 : a === "visual" ? 1 : 0;
  const copiesB = b === "super" ? 2 : b === "visual" ? 1 : 0;

  if (copiesA === 0 && copiesB === 0) return [];

  // 간단한 Punnett: 각 부모가 줄 수 있는 allele
  const allelesA = copiesA === 2 ? [1, 1] : copiesA === 1 ? [1, 0] : [0, 0];
  const allelesB = copiesB === 2 ? [1, 1] : copiesB === 1 ? [1, 0] : [0, 0];

  const counts = { 0: 0, 1: 0, 2: 0 };
  for (const a1 of allelesA) {
    for (const b1 of allelesB) {
      counts[(a1 + b1) as 0 | 1 | 2]++;
    }
  }
  const total = 4;
  const results: { label: string; probability: number }[] = [];

  if (counts[0] > 0) {
    results.push({ label: "노멀", probability: counts[0] / total });
  }
  if (counts[1] > 0) {
    results.push({ label: gene, probability: counts[1] / total });
  }
  if (counts[2] > 0) {
    if (rule.lethalSuper) {
      results.push({ label: `슈퍼${gene} (치사)`, probability: counts[2] / total });
    } else if (rule.superForm) {
      results.push({ label: rule.superForm, probability: counts[2] / total });
    } else {
      results.push({ label: `슈퍼${gene}`, probability: counts[2] / total });
    }
  }

  return results;
}

function crossRecessive(
  gene: string,
  a: GeneStatus,
  b: GeneStatus,
): { label: string; probability: number }[] {
  // 열성: 비주얼=2카피, 헷=1카피, 없음=0카피
  // 헷%는 확률적 상태 → 기대값으로 계산
  const probCarrierA = getCarrierProbability(a);
  const probCarrierB = getCarrierProbability(b);
  const copiesA = a === "visual" ? 2 : 0; // visual = homozygous
  const copiesB = b === "visual" ? 2 : 0;

  if (copiesA === 0 && copiesB === 0 && probCarrierA === 0 && probCarrierB === 0) {
    return [];
  }

  // 케이스별 계산
  if (copiesA === 2 && copiesB === 2) {
    // visual × visual → 100% visual
    return [{ label: gene, probability: 1 }];
  }

  if (copiesA === 2 || copiesB === 2) {
    // visual × het/none
    const hetProb = copiesA === 2 ? probCarrierB : probCarrierA;
    if (hetProb > 0) {
      // visual × het → 50% visual, 50% 100%het
      const results: { label: string; probability: number }[] = [];
      results.push({ label: gene, probability: 0.5 * hetProb });
      results.push({ label: `100%헷${gene}`, probability: 0.5 * hetProb });
      if (hetProb < 1) {
        // visual × (possibly not het) → 100%het for sure
        results.push({ label: `100%헷${gene}`, probability: 1 - hetProb });
      }
      return mergeOutcomes(results);
    }
    // visual × none → 100% het
    return [{ label: `100%헷${gene}`, probability: 1 }];
  }

  // het × het (both are carriers with some probability)
  if (probCarrierA > 0 && probCarrierB > 0) {
    const bothHet = probCarrierA * probCarrierB;
    const results: { label: string; probability: number }[] = [];

    // 둘 다 헷일 때: 25% visual, 50% het, 25% normal
    results.push({ label: gene, probability: bothHet * 0.25 });
    results.push({ label: `헷${gene}`, probability: bothHet * 0.5 });
    results.push({ label: "노멀", probability: bothHet * 0.25 });

    // 한쪽만 헷일 때: 50% het, 50% normal
    const oneHet =
      probCarrierA * (1 - probCarrierB) + (1 - probCarrierA) * probCarrierB;
    if (oneHet > 0) {
      results.push({ label: `가능성 헷${gene}`, probability: oneHet * 0.5 });
      results.push({ label: "노멀", probability: oneHet * 0.5 });
    }

    // 둘 다 아닐 때
    const neitherHet = (1 - probCarrierA) * (1 - probCarrierB);
    if (neitherHet > 0) {
      results.push({ label: "노멀", probability: neitherHet });
    }

    return mergeOutcomes(results);
  }

  // 한쪽만 carrier
  if (probCarrierA > 0 || probCarrierB > 0) {
    const hetProb = Math.max(probCarrierA, probCarrierB);
    return [
      { label: `가능성 헷${gene}`, probability: hetProb * 0.5 },
      { label: "노멀", probability: 1 - hetProb * 0.5 },
    ];
  }

  return [];
}

function getCarrierProbability(status: GeneStatus): number {
  switch (status) {
    case "visual": return 1; // technically 2 copies, handled separately
    case "super": return 1;
    case "het100": return 1;
    case "het66": return 0.66;
    case "het50": return 0.5;
    case "none": return 0;
  }
}

function mergeOutcomes(
  outcomes: { label: string; probability: number }[],
): { label: string; probability: number }[] {
  const map = new Map<string, number>();
  for (const o of outcomes) {
    map.set(o.label, (map.get(o.label) ?? 0) + o.probability);
  }
  return [...map.entries()]
    .map(([label, probability]) => ({ label, probability }))
    .filter((o) => o.probability > 0.01) // 1% 미만은 제거
    .sort((a, b) => b.probability - a.probability);
}

// --- 공개 API ---

/** 유전자 상태를 한국어 라벨로 변환 */
export function geneStatusLabel(status: GeneStatus): string {
  switch (status) {
    case "visual": return "비주얼";
    case "super": return "슈퍼";
    case "het100": return "100%헷";
    case "het66": return "66%헷";
    case "het50": return "50%헷";
    case "none": return "-";
  }
}

/** 두 부모의 모프로 자식 예측 */
export function predictOffspring(
  morphsA: string[],
  morphsB: string[],
): OffspringPrediction {
  const geneMapA = parseMorphsToGeneMap(morphsA);
  const geneMapB = parseMorphsToGeneMap(morphsB);

  // 양쪽 부모에서 관련된 모든 유전자 수집
  const allGenes = new Set([...geneMapA.keys(), ...geneMapB.keys()]);
  const genes: GenePrediction[] = [];

  for (const gene of allGenes) {
    const rule = CR_GENE_RULES[gene];
    if (!rule) continue;

    const statusA = geneMapA.get(gene) ?? "none";
    const statusB = geneMapB.get(gene) ?? "none";
    const outcomes = crossGene(gene, rule, statusA, statusB);

    if (outcomes.length > 0) {
      genes.push({ gene, type: rule.type, parentA: statusA, parentB: statusB, outcomes });
    }
  }

  return { genes };
}
