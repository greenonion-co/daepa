import type { CommonAncestorDetail } from "./coi";

/** COI 경로 엣지 */
export interface CoiPathEdge {
  source: string;
  target: string;
}

/**
 * COI 공통 조상 경로에서 그래프에 보이는 엣지 쌍만 추출
 * 양쪽 끝점이 모두 visibleNodeIds에 있는 경우만 반환
 */
export function extractCoiPathEdges(
  commonAncestors: CommonAncestorDetail[],
  visibleNodeIds: Set<string>,
): CoiPathEdge[] {
  const edgeSet = new Set<string>();
  const edges: CoiPathEdge[] = [];

  for (const ca of commonAncestors) {
    const allPaths = [...(ca.pathsFromA ?? []), ...(ca.pathsFromB ?? [])];
    for (const path of allPaths) {
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i];
        const b = path[i + 1];
        if (!a || !b) continue;
        if (!visibleNodeIds.has(a) || !visibleNodeIds.has(b)) continue;
        // 양방향 중복 제거
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ source: a, target: b });
        }
      }
    }
  }

  return edges;
}

/** 스토어에서 사용하는 단순 엣지 타입 */
export interface FamilyEdge {
  id: string;
  source: string;
  target: string;
}

