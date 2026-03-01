import { useCallback, useMemo, useState } from "react";
import { type QueryClient } from "@tanstack/react-query";
import {
  petControllerGetFamilyTree,
  PetDtoSex,
  PetDtoSpecies,
  type CreateMatingDtoSpecies,
  matingControllerCreateMating,
} from "@repo/api-client";
import { overlay } from "overlay-kit";
import { toast } from "@/lib/toast";
import ParentSearchSelector from "@/app/(브리더스룸)/components/selector/parentSearch";
import type { CoiPanelPetInfo } from "../components/CoiPanel";
import type { FamilyTreeNodeData, FamilyPetData } from "../lib/types";
import { useCoiCalculation } from "./useCoiCalculation";
import { extractCoiPathEdges } from "../lib/graph-utils";
import type { FamilyTreeResponse } from "./useFamilyTreeData";

interface UseCoiSelectionParams {
  nodesMap: Map<string, FamilyTreeNodeData>;
  petId: string;
  queryClient: QueryClient;
  mergeTree: (
    petId: string,
    nodes: FamilyTreeResponse["nodes"],
    centerPairPartnerIds: string[],
  ) => void;
  addPairEdge: (petIdA: string, petIdB: string) => void;
  invalidatePair: () => void;
  thumbnailMap: Map<string, string>;
  visibleNodeIdSet: Set<string>;
}

const isMale = (s?: string | null) => s === "M" || s === "MALE";
const isFemale = (s?: string | null) => s === "F" || s === "FEMALE";

export function useCoiSelection({
  nodesMap,
  petId,
  queryClient,
  mergeTree,
  addPairEdge,
  invalidatePair,
  thumbnailMap,
  visibleNodeIdSet,
}: UseCoiSelectionParams) {
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  // 노드 더블클릭 → COI 선택 (수컷=왼쪽 슬롯[0], 암컷=오른쪽 슬롯[1])
  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      setSelectedNodes((prev) => {
        if (prev.includes(nodeId)) {
          return prev.filter((id) => id !== nodeId);
        }

        const node = nodesMap.get(nodeId);
        const sex = node?.pet?.sex;
        const isNodeMale = sex === "M" || sex === "MALE";
        const isNodeFemale = sex === "F" || sex === "FEMALE";

        if (prev.length >= 2) return [nodeId];
        if (prev.length === 0) return [nodeId];

        const existingId = prev[0]!;
        if (existingId === nodeId) {
          toast.error("같은 개체를 부/모로 선택할 수 없습니다.");
          return prev;
        }

        const existingNode = nodesMap.get(existingId);
        const existingSex = existingNode?.pet?.sex;
        const isExistingMale = existingSex === "M" || existingSex === "MALE";

        if (isNodeMale) return [nodeId, existingId];
        if (isNodeFemale) return [existingId, nodeId];
        if (isExistingMale) return [existingId, nodeId];
        return [nodeId, existingId];
      });
    },
    [nodesMap],
  );

  // 외부 개체 검색으로 COI 대상 선택
  const handleSelectPetForCoi = useCallback(
    (searchSex?: PetDtoSex) => {
      const centerNode = nodesMap.get(petId);
      const species = centerNode?.pet?.species as PetDtoSpecies | undefined;
      overlay.open(({ isOpen: overlayOpen, close, unmount }) => (
        <ParentSearchSelector
          isOpen={overlayOpen}
          onClose={close}
          species={species ?? PetDtoSpecies.CRESTED}
          sex={searchSex}
          allowMyPetOnly
          excludePetId={petId}
          onSelect={async (selected) => {
            close();
            if (!nodesMap.has(selected.petId)) {
              try {
                const response = await queryClient.fetchQuery({
                  queryKey: ["family-tree-expand", selected.petId],
                  queryFn: () => petControllerGetFamilyTree(selected.petId, { depth: 2 }),
                  staleTime: 5 * 60 * 1000,
                });
                const data = response.data as unknown as FamilyTreeResponse;
                mergeTree(selected.petId, data.nodes, data.centerPairPartnerIds ?? []);
              } catch {
                // 트리 병합 실패 시 무시
              }
            }
            setSelectedNodes((prev) => {
              if (prev.includes(selected.petId)) {
                toast.error("같은 개체를 부/모로 선택할 수 없습니다.");
                return prev;
              }
              if (prev.length === 0) return [selected.petId];
              const existingId = prev[0]!;
              const existingNode = nodesMap.get(existingId);
              const existingSex = existingNode?.pet?.sex;
              const isSelectedMale = selected.sex === PetDtoSex.MALE;
              const isSelectedFemale = selected.sex === PetDtoSex.FEMALE;
              const isExistingMale = existingSex === "M" || existingSex === "MALE";
              if (isSelectedMale) return [selected.petId, existingId];
              if (isSelectedFemale) return [existingId, selected.petId];
              if (isExistingMale) return [existingId, selected.petId];
              return [selected.petId, existingId];
            });
          }}
          onExit={unmount}
          onlySelect
        />
      ));
    },
    [nodesMap, petId, queryClient, mergeTree],
  );

  // 메이트 선택 (메이팅 생성 + 트리 병합)
  const handleSelectMate = useCallback(
    (nodeId: string) => {
      const n = nodesMap.get(nodeId);
      if (!n?.pet) return;
      const petSex = n.pet.sex;
      const isNodeMale = petSex === "M" || petSex === "MALE";
      const searchSex = isNodeMale ? PetDtoSex.FEMALE : PetDtoSex.MALE;
      const species = n.pet.species as PetDtoSpecies | undefined;
      overlay.open(({ isOpen: overlayOpen, close, unmount }) => (
        <ParentSearchSelector
          isOpen={overlayOpen}
          onClose={close}
          species={species ?? PetDtoSpecies.CRESTED}
          sex={searchSex}
          allowMyPetOnly
          excludePetId={nodeId}
          onSelect={async (mate) => {
            close();
            const fatherId = isNodeMale ? nodeId : mate.petId;
            const motherId = isNodeMale ? mate.petId : nodeId;
            const matingSpecies = (species ?? mate.species ?? "CRESTED") as CreateMatingDtoSpecies;
            try {
              await matingControllerCreateMating({
                fatherId,
                motherId,
                matingDate: new Date().toISOString().slice(0, 10),
                season: 1,
                species: matingSpecies,
              });
              if (!nodesMap.has(mate.petId)) {
                try {
                  const response = await queryClient.fetchQuery({
                    queryKey: ["family-tree-expand", mate.petId],
                    queryFn: () => petControllerGetFamilyTree(mate.petId, { depth: 2 }),
                    staleTime: 5 * 60 * 1000,
                  });
                  const data = response.data as unknown as FamilyTreeResponse;
                  mergeTree(mate.petId, data.nodes, data.centerPairPartnerIds ?? []);
                } catch {
                  // 트리 병합 실패 시 무시
                }
              }
              addPairEdge(fatherId, motherId);
              invalidatePair();
              queryClient.invalidateQueries({ queryKey: ["family-tree", petId] });
              setSelectedNodes([nodeId, mate.petId]);
              toast.success("메이팅이 추가되었습니다.");
            } catch {
              toast.error("메이팅 추가에 실패했습니다.");
            }
          }}
          onExit={unmount}
          onlySelect
        />
      ));
    },
    [nodesMap, queryClient, mergeTree, addPairEdge, invalidatePair, petId],
  );

  // COI 계산
  const {
    coi,
    level: coiLevel,
    commonAncestors,
    equivalentRelation,
    isLoading: isCoiLoading,
  } = useCoiCalculation(selectedNodes[0], selectedNodes[1]);

  // COI 경로 엣지 (그래프 하이라이트용)
  const coiHighlightedEdges = useMemo(
    () => extractCoiPathEdges(commonAncestors, visibleNodeIdSet),
    [commonAncestors, visibleNodeIdSet],
  );

  // 선택된 펫 데이터
  const selectedPetA = selectedNodes[0]
    ? (nodesMap.get(selectedNodes[0])?.pet ?? undefined)
    : undefined;
  const selectedPetB = selectedNodes[1]
    ? (nodesMap.get(selectedNodes[1])?.pet ?? undefined)
    : undefined;

  const isMaleFemale = useMemo(
    () =>
      (isMale(selectedPetA?.sex) && isFemale(selectedPetB?.sex)) ||
      (isFemale(selectedPetA?.sex) && isMale(selectedPetB?.sex)),
    [selectedPetA?.sex, selectedPetB?.sex],
  );
  const isBothOwned = useMemo(
    () => !!(selectedPetA?.isOwner && selectedPetB?.isOwner),
    [selectedPetA?.isOwner, selectedPetB?.isOwner],
  );

  // coiPets: 항상 [부(index 0), 모(index 1)] 고정 슬롯
  const toCoiPetInfo = (pet: FamilyPetData): CoiPanelPetInfo => ({
    petId: pet.petId,
    name: pet.name ?? undefined,
    sex: pet.sex ?? undefined,
    species: pet.species ?? undefined,
    imageUrl: thumbnailMap.get(pet.petId),
    ownerName: pet.ownerName ?? undefined,
  });

  const coiPets: (CoiPanelPetInfo | undefined)[] = (() => {
    const pets = [selectedPetA, selectedPetB].filter(Boolean);
    if (pets.length === 0) return [undefined, undefined];
    if (pets.length === 2) {
      return [toCoiPetInfo(pets[0]!), toCoiPetInfo(pets[1]!)];
    }
    const pet = pets[0]!;
    const info = toCoiPetInfo(pet);
    if (isFemale(pet.sex)) return [undefined, info];
    return [info, undefined];
  })();

  // 선택된 두 개체의 부모 역할 결정
  const { pairFatherId, pairMotherId, pairFather, pairMother } = useMemo(() => {
    if (!selectedNodes[0] || !selectedNodes[1])
      return {
        pairFatherId: undefined as string | undefined,
        pairMotherId: undefined as string | undefined,
        pairFather: undefined as FamilyPetData | undefined,
        pairMother: undefined as FamilyPetData | undefined,
      };
    const sexA = selectedPetA?.sex;
    const sexB = selectedPetB?.sex;
    const isMaleA = sexA === "M" || sexA === "MALE";
    const isFemaleB = sexB === "F" || sexB === "FEMALE";
    const isFemaleA = sexA === "F" || sexA === "FEMALE";
    const isMaleB = sexB === "M" || sexB === "MALE";
    if (isMaleA && isFemaleB)
      return {
        pairFatherId: selectedNodes[0],
        pairMotherId: selectedNodes[1],
        pairFather: selectedPetA,
        pairMother: selectedPetB,
      };
    if (isFemaleA && isMaleB)
      return {
        pairFatherId: selectedNodes[1],
        pairMotherId: selectedNodes[0],
        pairFather: selectedPetB,
        pairMother: selectedPetA,
      };
    return {
      pairFatherId: selectedNodes[0],
      pairMotherId: selectedNodes[1],
      pairFather: selectedPetA,
      pairMother: selectedPetB,
    };
  }, [selectedNodes, selectedPetA, selectedPetB]);

  const handleCoiClear = useCallback(() => setSelectedNodes([]), []);
  const handleCoiClearPet = useCallback(
    (id: string) => setSelectedNodes((prev) => prev.filter((p) => p !== id)),
    [],
  );
  const handleCoiSelectMate = useCallback(
    (role: string) => {
      const sex = role === "부" ? PetDtoSex.MALE : PetDtoSex.FEMALE;
      handleSelectPetForCoi(sex);
    },
    [handleSelectPetForCoi],
  );

  return {
    selectedNodes,
    setSelectedNodes,
    handleNodeDoubleClick,
    handleSelectMate,
    handleSelectPetForCoi,
    coi,
    coiLevel,
    commonAncestors,
    equivalentRelation,
    isCoiLoading,
    coiHighlightedEdges,
    selectedPetA,
    selectedPetB,
    isMaleFemale,
    isBothOwned,
    coiPets,
    pairFatherId,
    pairMotherId,
    pairFather,
    pairMother,
    handleCoiClear,
    handleCoiClearPet,
    handleCoiSelectMate,
  };
}
