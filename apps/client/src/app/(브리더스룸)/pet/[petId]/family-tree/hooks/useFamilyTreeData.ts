import { useQuery } from "@tanstack/react-query";
import { petControllerFindPetByPetId, petControllerGetFamilyTree } from "@repo/api-client";
import type { FamilyTreeApiNodeOrHidden } from "../lib/types";

export interface FamilyTreeResponse {
  nodes: FamilyTreeApiNodeOrHidden[];
  centerPairPartnerIds: string[];
}

export function useCenterPet(petId: string) {
  return useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
    enabled: !!petId,
  });
}

/**
 * Recursive CTE 기반 가계도 노드 전체 조회
 * GET /v1/pet/family-tree/:petId?depth=N&ancestorDepth=M
 * - depth: 후손 탐색 깊이 (기본 2)
 * - ancestorDepth: 조상(부모·조부모 등) 탐색 깊이 (기본 2)
 */
export function useFamilyTree(petId: string, depth: number = 2, ancestorDepth: number = 2) {
  return useQuery({
    queryKey: ["family-tree", petId, depth, ancestorDepth],
    queryFn: async () => {
      const response = await petControllerGetFamilyTree(petId, { depth, ancestorDepth });
      return response.data;
    },
    select: (data): FamilyTreeResponse => ({
      nodes: data.nodes as unknown as FamilyTreeApiNodeOrHidden[],
      centerPairPartnerIds: (data.centerPairPartnerIds ?? []) as string[],
    }),
    enabled: !!petId,
    staleTime: 5 * 60 * 1000,
  });
}
