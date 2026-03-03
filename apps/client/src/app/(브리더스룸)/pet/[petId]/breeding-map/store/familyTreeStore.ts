import { create } from "zustand";
import type { PetDto } from "@repo/api-client";
import type { FamilyTreeNodeData, FamilyTreeApiNodeOrHidden } from "../lib/types";
import { toPetData, apiNodeToPetData, isHiddenNode } from "../lib/types";
import { type FamilyEdge } from "../lib/graph-utils";

interface FamilyTreeStore {
  centerPetId: string;
  /** petId → 노드 데이터 */
  nodesMap: Map<string, FamilyTreeNodeData>;
  /** 엣지 id → FamilyEdge */
  edgesMap: Map<string, FamilyEdge>;
  /** 확장 fetch가 완료된 노드 ID 집합 */
  expandedNodeIds: Set<string>;
  /** 검색으로 추가된 외부 트리의 루트 petId 목록 */
  externalTreeRootIds: string[];

  // Actions
  setFamilyTree: (petId: string, nodes: FamilyTreeApiNodeOrHidden[], centerPairPartnerIds: string[]) => void;
  mergeTree: (petId: string, nodes: FamilyTreeApiNodeOrHidden[], centerPairPartnerIds: string[]) => void;
  updateNodePet: (petId: string, pet: PetDto) => void;
  addPairEdge: (petIdA: string, petIdB: string) => void;
  removePairEdge: (petIdA: string, petIdB: string) => void;
  addExternalTreeRoot: (petId: string) => void;
  removeExternalTreeRoot: (petId: string) => void;

  // Selectors
  getGenerationMap: () => Map<string, number>;
}

/**
 * fatherId/motherId 기반으로 엣지 맵 생성
 * - offspring 엣지: parent → child
 * - pair 엣지: fatherId ↔ motherId (normalize by min-max)
 * 양쪽 끝점 모두 nodeIds에 존재하는 경우만 엣지 생성 (d3-force "node not found" 방지)
 */
function buildEdgesMap(nodes: FamilyTreeApiNodeOrHidden[]): Map<string, FamilyEdge> {
  const nodeIds = new Set(nodes.map((n) => n.petId));
  const edgesMap = new Map<string, FamilyEdge>();

  for (const node of nodes) {
    if (isHiddenNode(node)) continue; // 비공개 노드는 fatherId/motherId 없음
    const { petId, fatherId, motherId } = node;

    if (fatherId && nodeIds.has(fatherId)) {
      const id = `offspring-${fatherId}-${petId}`;
      edgesMap.set(id, { id, source: fatherId, target: petId });
    }

    if (motherId && nodeIds.has(motherId)) {
      const id = `offspring-${motherId}-${petId}`;
      edgesMap.set(id, { id, source: motherId, target: petId });
    }

    if (fatherId && motherId && nodeIds.has(fatherId) && nodeIds.has(motherId)) {
      const [a, b] = fatherId < motherId ? [fatherId, motherId] : [motherId, fatherId];
      const id = `pair-${a}-${b}`;
      edgesMap.set(id, { id, source: a, target: b });
    }
  }

  return edgesMap;
}

/**
 * BFS로 중심 개체로부터 세대 맵 생성
 * - pair 엣지: 같은 세대
 * - offspring 엣지 (source→target): target = source + 1
 */
function computeGenerationMap(
  nodesMap: Map<string, FamilyTreeNodeData>,
  edgesMap: Map<string, FamilyEdge>,
  centerPetId: string,
): Map<string, number> {
  const generationMap = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; gen: number }[] = [{ id: centerPetId, gen: 0 }];

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    if (visited.has(id)) continue;
    if (!nodesMap.has(id)) continue;

    visited.add(id);
    generationMap.set(id, gen);

    for (const edge of edgesMap.values()) {
      const isPair = edge.id.startsWith("pair-");
      if (edge.source === id && !visited.has(edge.target)) {
        queue.push({ id: edge.target, gen: isPair ? gen : gen + 1 });
      }
      if (edge.target === id && !visited.has(edge.source)) {
        queue.push({ id: edge.source, gen: isPair ? gen : gen - 1 });
      }
    }
  }

  return generationMap;
}

export const useFamilyTreeStore = create<FamilyTreeStore>((set, get) => ({
  centerPetId: "",
  nodesMap: new Map(),
  edgesMap: new Map(),
  expandedNodeIds: new Set(),
  externalTreeRootIds: [],

  setFamilyTree: (petId, nodes, centerPairPartnerIds) => {
    const nodesMap = new Map<string, FamilyTreeNodeData>();

    for (const node of nodes) {
      if (isHiddenNode(node)) {
        nodesMap.set(node.petId, {
          petId: node.petId,
          pet: null,
          isCenterPet: false,
          fatherId: null,
          motherId: null,
          isHidden: true,
        });
      } else {
        nodesMap.set(node.petId, {
          petId: node.petId,
          pet: apiNodeToPetData(node),
          isCenterPet: node.petId === petId,
          fatherId: node.fatherId,
          motherId: node.motherId,
        });
      }
    }

    const edgesMap = buildEdgesMap(nodes);

    // pairs 테이블 기준 파트너 엣지 추가 (자식 없는 페어도 연결)
    for (const partnerId of centerPairPartnerIds) {
      if (nodesMap.has(partnerId)) {
        const [a, b] = petId < partnerId ? [petId, partnerId] : [partnerId, petId];
        const id = `pair-${a}-${b}`;
        if (!edgesMap.has(id)) {
          edgesMap.set(id, { id, source: a, target: b });
        }
      }
    }

    set({ centerPetId: petId, nodesMap, edgesMap, expandedNodeIds: new Set(), externalTreeRootIds: [] });
  },

  mergeTree: (petId, nodes, centerPairPartnerIds) => {
    const { nodesMap: existingNodes, edgesMap: existingEdges, expandedNodeIds } = get();

    // 기존 노드는 유지, 새 노드만 추가
    const newNodesMap = new Map(existingNodes);
    for (const node of nodes) {
      if (!newNodesMap.has(node.petId)) {
        if (isHiddenNode(node)) {
          newNodesMap.set(node.petId, {
            petId: node.petId,
            pet: null,
            isCenterPet: false,
            fatherId: null,
            motherId: null,
            isHidden: true,
          });
        } else {
          newNodesMap.set(node.petId, {
            petId: node.petId,
            pet: apiNodeToPetData(node),
            isCenterPet: false,
            fatherId: node.fatherId,
            motherId: node.motherId,
          });
        }
      }
    }

    // 전체 노드 ID 집합 (기존 + 신규)
    const allNodeIds = new Set(newNodesMap.keys());
    const newEdgesMap = new Map(existingEdges);

    // 전체 노드 순회하며 새로 연결 가능한 엣지 추가
    for (const node of newNodesMap.values()) {
      const { petId: nId, fatherId, motherId } = node;

      if (fatherId && allNodeIds.has(fatherId)) {
        const id = `offspring-${fatherId}-${nId}`;
        if (!newEdgesMap.has(id)) newEdgesMap.set(id, { id, source: fatherId, target: nId });
      }
      if (motherId && allNodeIds.has(motherId)) {
        const id = `offspring-${motherId}-${nId}`;
        if (!newEdgesMap.has(id)) newEdgesMap.set(id, { id, source: motherId, target: nId });
      }
      if (fatherId && motherId && allNodeIds.has(fatherId) && allNodeIds.has(motherId)) {
        const [a, b] = fatherId < motherId ? [fatherId, motherId] : [motherId, fatherId];
        const id = `pair-${a}-${b}`;
        if (!newEdgesMap.has(id)) newEdgesMap.set(id, { id, source: a, target: b });
      }
    }

    // 클릭한 개체의 pair 파트너 엣지 추가
    for (const partnerId of centerPairPartnerIds) {
      if (newNodesMap.has(partnerId)) {
        const [a, b] = petId < partnerId ? [petId, partnerId] : [partnerId, petId];
        const id = `pair-${a}-${b}`;
        if (!newEdgesMap.has(id)) newEdgesMap.set(id, { id, source: a, target: b });
      }
    }

    const newExpandedNodeIds = new Set(expandedNodeIds);
    newExpandedNodeIds.add(petId);

    set({ nodesMap: newNodesMap, edgesMap: newEdgesMap, expandedNodeIds: newExpandedNodeIds });
  },

  addPairEdge: (petIdA, petIdB) => {
    const { edgesMap } = get();
    const [a, b] = petIdA < petIdB ? [petIdA, petIdB] : [petIdB, petIdA];
    const id = `pair-${a}-${b}`;
    if (edgesMap.has(id)) return;
    const newEdges = new Map(edgesMap);
    newEdges.set(id, { id, source: a, target: b });
    set({ edgesMap: newEdges });
  },

  removePairEdge: (petIdA, petIdB) => {
    const { edgesMap } = get();
    const [a, b] = petIdA < petIdB ? [petIdA, petIdB] : [petIdB, petIdA];
    const id = `pair-${a}-${b}`;
    if (!edgesMap.has(id)) return;
    const newEdges = new Map(edgesMap);
    newEdges.delete(id);
    set({ edgesMap: newEdges });
  },

  updateNodePet: (petId, pet) => {
    const { nodesMap } = get();
    const node = nodesMap.get(petId);
    if (!node) return;

    const newNodes = new Map(nodesMap);
    newNodes.set(petId, { ...node, pet: toPetData(pet) });
    set({ nodesMap: newNodes });
  },

  addExternalTreeRoot: (petId) => {
    const { externalTreeRootIds } = get();
    if (externalTreeRootIds.includes(petId)) return;
    set({ externalTreeRootIds: [...externalTreeRootIds, petId] });
  },

  removeExternalTreeRoot: (petId) => {
    const { externalTreeRootIds } = get();
    set({ externalTreeRootIds: externalTreeRootIds.filter((id) => id !== petId) });
  },

  getGenerationMap: () => {
    const { nodesMap, edgesMap, centerPetId } = get();
    if (!centerPetId) return new Map();
    return computeGenerationMap(nodesMap, edgesMap, centerPetId);
  },
}));
