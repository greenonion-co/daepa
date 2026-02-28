"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  petImageControllerFindThumbnail,
  petControllerFindPetByPetId,
  petControllerGetFamilyTree,
  petControllerFindAll,
  pairControllerGetPairList,
  matingControllerCreateMating,
  PetDtoSex,
  PetDtoSpecies,
  type CreateMatingDtoSpecies,
} from "@repo/api-client";
import { buildR2TransformedUrl } from "@/lib/utils";
import { IMAGE_TRANSFORMS } from "@/app/constants";
import ForceGraph, { type GraphNode, type GraphLink } from "./ForceGraph";
import PetDetailPanel from "./PetDetailPanel";
import CoiPanel, { type CoiPanelPetInfo } from "./CoiPanel";
import OffspringPredictionPanel from "./OffspringPredictionPanel";
import PairStatisticsPanel, { type PairChildInfo } from "./PairStatisticsPanel";
import MorphLegend from "./MorphLegend";
import CreateLayingModal from "../../../../hatching/components/CreateLayingModal";
import { PairDetailContent } from "./PairDetailContent";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { overlay } from "overlay-kit";
import NodeContextMenu from "./NodeContextMenu";
import PetDetailModal from "../../components/PetDetailModal";
import { useCenterPet, useFamilyTree, type FamilyTreeResponse } from "../hooks/useFamilyTreeData";
import { useCoiCalculation } from "../hooks/useCoiCalculation";
import { usePairStatistics } from "../hooks/usePairStatistics";
import { usePairInvalidate } from "../../../../hatching/hooks/usePairInvalidate";
import { useFamilyTreeStore } from "../store/familyTreeStore";
import { extractCoiPathEdges } from "../lib/graph-utils";
import Loading from "@/components/common/Loading";
import { toast } from "@/lib/toast";
import { useQueries } from "@tanstack/react-query";
import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import QuickRegisterModal from "./QuickRegisterModal";
import ParentSearchSelector from "@/app/(브리더스룸)/components/selector/parentSearch";

interface FamilyTreeCanvasProps {
  petId: string;
}

export default function FamilyTreeCanvas({ petId }: FamilyTreeCanvasProps) {
  const centerPetId = useFamilyTreeStore((s) => s.centerPetId);
  const nodesMap = useFamilyTreeStore((s) => s.nodesMap);
  const edgesMap = useFamilyTreeStore((s) => s.edgesMap);
  const expandedNodeIds = useFamilyTreeStore((s) => s.expandedNodeIds);
  const setFamilyTree = useFamilyTreeStore((s) => s.setFamilyTree);
  const mergeTree = useFamilyTreeStore((s) => s.mergeTree);
  const getGenerationMap = useFamilyTreeStore((s) => s.getGenerationMap);
  const updateNodePet = useFamilyTreeStore((s) => s.updateNodePet);
  const addPairEdge = useFamilyTreeStore((s) => s.addPairEdge);
  const removePairEdge = useFamilyTreeStore((s) => s.removePairEdge);

  const queryClient = useQueryClient();
  const invalidatePair = usePairInvalidate();
  const router = useRouter();
  const [hoveredPetId, setHoveredPetId] = useState<string | null>(null);
  const [panelPetId, setPanelPetId] = useState<string | null>(petId);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [detailModalPetId, setDetailModalPetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{
    position: { x: number; y: number };
  } | null>(null);
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const [showLayingModal, setShowLayingModal] = useState(false);
  const [addingPetId, setAddingPetId] = useState<string | null>(null);
  const [sexFilter, setSexFilter] = useState<"M" | "F" | "NONE" | null>(null);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickRegisterSimPosition, setQuickRegisterSimPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [initialNodePositions, setInitialNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  // 중심 개체 fetch
  const { data: centerPet, isLoading: isCenterLoading } = useCenterPet(petId);

  // 가계도 전체 데이터 fetch (Recursive CTE)
  const { data: familyTreeNodes, isLoading: isTreeLoading } = useFamilyTree(petId);

  // 가계도 데이터 로드 시 스토어 초기화
  useEffect(() => {
    if (familyTreeNodes) {
      setFamilyTree(petId, familyTreeNodes.nodes, familyTreeNodes.centerPairPartnerIds ?? []);
    }
  }, [familyTreeNodes, petId, setFamilyTree]);

  // 스토어에서 모든 노드/엣지/세대 맵 추출
  const visibleNodes = useMemo(() => Array.from(nodesMap.values()), [nodesMap]);
  const visibleEdges = useMemo(() => Array.from(edgesMap.values()), [edgesMap]);
  const generationMap = getGenerationMap();

  // 썸네일 URL 일괄 fetch
  const thumbnailQueries = useQueries({
    queries: visibleNodes.map((node) => ({
      queryKey: [petImageControllerFindThumbnail.name, node.petId],
      queryFn: () => petImageControllerFindThumbnail(node.petId),
      select: (response: Awaited<ReturnType<typeof petImageControllerFindThumbnail>>) =>
        response.data.data,
      staleTime: Infinity,
      gcTime: Infinity,
      enabled: !!node.petId && !node.isHidden,
    })),
  });

  // petId → imageUrl 맵 생성
  const thumbnailMap = useMemo(() => {
    const map = new Map<string, string>();
    thumbnailQueries.forEach((query, i) => {
      if (query.data?.url) {
        const url = buildR2TransformedUrl(query.data.url, IMAGE_TRANSFORMS.sm);
        const node = visibleNodes[i];
        if (url && node) map.set(node.petId, url);
      }
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbnailQueries.map((q) => q.data?.url).join(",")]);

  // 안정적인 키 (리렌더 시 시뮬레이션 재시작 방지)
  const nodeKey = visibleNodes.map((n) => n.petId).join(",");
  // 노드 데이터 변경 감지용 키 (name/sex 변경 시 graphNodes 재계산)
  const nodeDataKey = visibleNodes.map((n) => `${n.petId}:${n.pet?.name}:${n.pet?.sex}`).join(",");
  const edgeKey = visibleEdges.map((e) => `${e.source}-${e.target}`).join(",");
  const pairEdgeKey = visibleEdges
    .filter((e) => e.id.startsWith("pair-"))
    .map((e) => e.id)
    .join(",");

  // 중심 개체의 pair 파트너 ID 수집
  const pairPartnerIds = useMemo(() => {
    const partners = new Set<string>();
    for (const edge of visibleEdges) {
      if (edge.id.startsWith("pair-")) {
        if (edge.source === centerPetId) partners.add(edge.target);
        if (edge.target === centerPetId) partners.add(edge.source);
      }
    }
    return partners;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairEdgeKey, centerPetId]);

  // ForceGraph 데이터 변환
  const { graphNodes, graphLinks } = useMemo(() => {
    // 타인의 비공개 개체 제외 (isHidden 또는 비공개 && 비소유)
    const publicNodes = visibleNodes.filter(
      (n) => !n.isHidden && !(n.pet?.isPublic === false && !n.pet?.isOwner),
    );
    const publicNodeIds = new Set(publicNodes.map((n) => n.petId));

    const degreeMap = new Map<string, number>();
    for (const edge of visibleEdges) {
      if (publicNodeIds.has(edge.source) && publicNodeIds.has(edge.target)) {
        degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
        degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
      }
    }

    const nodes: GraphNode[] = publicNodes.map((n) => ({
      id: n.petId,
      label: n.pet?.name ?? "이름 없음",
      degree: degreeMap.get(n.petId) ?? 0,
      imageUrl: thumbnailMap.get(n.petId),
      sex: n.pet?.sex,
      isPairOfCenter: pairPartnerIds.has(n.petId),
      generation: generationMap.get(n.petId),
      morphs: n.pet?.morphs,
      isPrivate: false,
      fatherId: n.fatherId ?? undefined,
      motherId: n.motherId ?? undefined,
    }));

    const links: GraphLink[] = visibleEdges
      .filter((e) => publicNodeIds.has(e.source) && publicNodeIds.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
        isPair: e.id.startsWith("pair-"),
      }));

    return { graphNodes: nodes, graphLinks: links };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeKey, nodeDataKey, edgeKey, thumbnailMap, pairPartnerIds]);

  // 성별 필터 적용 (필터 없으면 전체, 있으면 해당 성별 노드만 + 중심 개체는 항상 포함)
  const { filteredGraphNodes, filteredGraphLinks } = useMemo(() => {
    if (!sexFilter) return { filteredGraphNodes: graphNodes, filteredGraphLinks: graphLinks };

    const matchesSex = (sex?: string) => {
      if (sexFilter === "M") return sex === "M" || sex === "MALE";
      if (sexFilter === "F") return sex === "F" || sex === "FEMALE";
      // NONE: 성별 미구분 (M/F 아닌 값)
      return sex !== "M" && sex !== "MALE" && sex !== "F" && sex !== "FEMALE";
    };

    const filteredNodes = graphNodes.filter((n) => n.id === petId || matchesSex(n.sex));
    const filteredIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphLinks.filter(
      (l) => filteredIds.has(l.source as string) && filteredIds.has(l.target as string),
    );

    return { filteredGraphNodes: filteredNodes, filteredGraphLinks: filteredLinks };
  }, [graphNodes, graphLinks, sexFilter, petId]);

  // 노드 우클릭 → 컨텍스트 메뉴
  const handleNodeContextMenu = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      setContextMenu({ nodeId, position });
    },
    [],
  );

  const handleCanvasContextMenu = useCallback(
    (position: { x: number; y: number }, simPosition?: { x: number; y: number }) => {
      setCanvasContextMenu({ position });
      if (simPosition) setQuickRegisterSimPosition(simPosition);
    },
    [],
  );

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
              // 선택한 개체가 트리에 없으면 병합
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
              // 1마리 있으면 성별 기반 [부, 모] 배치
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

  const handleContextMenuAction = useCallback(
    (action: string, nodeId: string) => {
      setContextMenu(null);
      switch (action) {
        case "detail": {
          // 타인의 비공개 개체는 petControllerFindPetByPetId 호출 불가
          const n = nodesMap.get(nodeId);
          if (n?.isHidden || (n?.pet?.isPublic === false && !n?.pet?.isOwner)) return;
          setDetailModalPetId(nodeId);
          break;
        }
        case "select-mate": {
          handleSelectMate(nodeId);
          break;
        }
        case "relation":
          router.push(`/pet/${nodeId}/relation`);
          break;
        case "family-tree":
          router.push(`/pet/${nodeId}/family-tree`);
          break;
      }
    },
    [router, nodesMap, handleSelectMate],
  );

  // 노드 단일클릭 → 패널 고정 + 트리 확장
  const handleNodeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (nodeId: string, _position: { x: number; y: number }) => {
      const nodeData = nodesMap.get(nodeId);
      // 타인의 비공개 개체는 클릭 불가
      if (nodeData?.isHidden || (nodeData?.pet?.isPublic === false && !nodeData?.pet?.isOwner))
        return;

      // 클릭 시 패널 고정 (중심 개체 포함 모든 노드)
      setPanelPetId(nodeId);

      // 이미 확장됐거나 중심 개체면 확장 skip
      if (nodeId === centerPetId || expandedNodeIds.has(nodeId)) return;

      try {
        const response = await queryClient.fetchQuery({
          queryKey: ["family-tree-expand", nodeId],
          queryFn: () => petControllerGetFamilyTree(nodeId, { depth: 2 }),
          staleTime: 5 * 60 * 1000,
        });
        const data = response.data as unknown as FamilyTreeResponse;
        const hasNewNodes = data.nodes.some((n) => !nodesMap.has(n.petId));
        mergeTree(nodeId, data.nodes, data.centerPairPartnerIds ?? []);
        if (!hasNewNodes) {
          toast.info("추가로 표시할 개체가 없습니다.");
        }
      } catch {
        // 실패 시 무시
      }
    },
    [centerPetId, expandedNodeIds, mergeTree, queryClient, nodesMap, setPanelPetId],
  );

  // 노드 더블클릭 → COI 선택 (수컷=왼쪽 슬롯[0], 암컷=오른쪽 슬롯[1])
  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      setSelectedNodes((prev) => {
        // 이미 선택된 노드 → 해제
        if (prev.includes(nodeId)) {
          return prev.filter((id) => id !== nodeId);
        }

        const node = nodesMap.get(nodeId);
        const sex = node?.pet?.sex;
        const isNodeMale = sex === "M" || sex === "MALE";
        const isNodeFemale = sex === "F" || sex === "FEMALE";

        // 2마리 이상이면 리셋 후 이 노드만
        if (prev.length >= 2) {
          return [nodeId];
        }

        // 0마리 → 성별에 따라 슬롯 배치
        if (prev.length === 0) {
          return [nodeId];
        }

        // 1마리 → 같은 개체 선택 방지
        const existingId = prev[0]!;
        if (existingId === nodeId) {
          toast.error("같은 개체를 부/모로 선택할 수 없습니다.");
          return prev;
        }

        const existingNode = nodesMap.get(existingId);
        const existingSex = existingNode?.pet?.sex;
        const isExistingMale = existingSex === "M" || existingSex === "MALE";

        // 새 노드가 수컷이면 왼쪽(부), 기존을 오른쪽(모)
        if (isNodeMale) return [nodeId, existingId];
        // 새 노드가 암컷이면 오른쪽(모), 기존을 왼쪽(부)
        if (isNodeFemale) return [existingId, nodeId];
        // 성별 불명: 기존이 수컷이면 기존을 왼쪽 유지
        if (isExistingMale) return [existingId, nodeId];
        return [nodeId, existingId];
      });
    },
    [nodesMap],
  );

  // COI 계산
  const {
    coi,
    level: coiLevel,
    commonAncestors,
    equivalentRelation,
    isLoading: isCoiLoading,
  } = useCoiCalculation(selectedNodes[0], selectedNodes[1]);

  // 모프 범례 (보이는 노드에서 중복 제거)
  const visibleMorphs = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const n of visibleNodes) {
      for (const m of n.pet?.morphs ?? []) {
        if (!seen.has(m)) {
          seen.add(m);
          result.push(m);
        }
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeKey]);

  // COI 경로 엣지 (그래프 하이라이트용)
  const visibleNodeIdSet = useMemo(
    () => new Set(visibleNodes.map((n) => n.petId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeKey],
  );

  const coiHighlightedEdges = useMemo(
    () => extractCoiPathEdges(commonAncestors, visibleNodeIdSet),
    [commonAncestors, visibleNodeIdSet],
  );

  // 선택된 펫 데이터
  const selectedPetA = selectedNodes[0] ? nodesMap.get(selectedNodes[0])?.pet : undefined;
  const selectedPetB = selectedNodes[1] ? nodesMap.get(selectedNodes[1])?.pet : undefined;

  const isMale = (s?: string | null) => s === "M" || s === "MALE";
  const isFemale = (s?: string | null) => s === "F" || s === "FEMALE";
  const isMaleFemale =
    (isMale(selectedPetA?.sex) && isFemale(selectedPetB?.sex)) ||
    (isFemale(selectedPetA?.sex) && isMale(selectedPetB?.sex));
  const isBothOwned = !!(selectedPetA?.isOwner && selectedPetB?.isOwner);

  // coiPets: 항상 [부(index 0), 모(index 1)] 고정 슬롯. 1마리여도 성별에 맞는 슬롯에 배치.
  const toCoiPetInfo = (pet: NonNullable<typeof selectedPetA>): CoiPanelPetInfo => ({
    petId: pet.petId,
    name: pet.name ?? undefined,
    sex: pet.sex ?? undefined,
    species: pet.species ?? undefined,
    imageUrl: thumbnailMap.get(pet.petId),
    ownerName: pet.ownerName ?? undefined,
  });

  const coiPets: (CoiPanelPetInfo | undefined)[] = (() => {
    const pets = [selectedPetA, selectedPetB].filter(Boolean) as NonNullable<typeof selectedPetA>[];
    if (pets.length === 0) return [undefined, undefined];
    if (pets.length === 2) {
      // 2마리: selectedNodes 순서 그대로 (handleNodeDoubleClick에서 [부, 모] 보장)
      return [toCoiPetInfo(pets[0]!), toCoiPetInfo(pets[1]!)];
    }
    // 1마리: 성별에 따라 슬롯 배치
    const pet = pets[0]!;
    const info = toCoiPetInfo(pet);
    if (isFemale(pet.sex)) return [undefined, info];
    return [info, undefined];
  })();

  // 개체 상세 모달 닫기 → 변경된 pet 데이터로 노드 업데이트
  const handleModalClose = useCallback(async () => {
    if (!detailModalPetId) return;
    const closingPetId = detailModalPetId;
    setDetailModalPetId(null);
    // 가계도 쿼리 무효화 → 새 자식 노드 반영
    queryClient.invalidateQueries({ queryKey: ["family-tree", petId] });
    try {
      const fresh = await queryClient.fetchQuery({
        queryKey: [petControllerFindPetByPetId.name, closingPetId],
        queryFn: () => petControllerFindPetByPetId(closingPetId),
        staleTime: 0,
      });
      const pet = fresh.data.data;
      if (pet) updateNodePet(closingPetId, pet);
    } catch {
      // 실패 시 노드는 기존 데이터 유지
    }
  }, [detailModalPetId, petId, queryClient, updateNodePet]);

  // 개체 상세 모달용 pet 데이터 fetch
  const { data: detailPet } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, detailModalPetId],
    queryFn: () => petControllerFindPetByPetId(detailModalPetId!),
    select: (response) => response.data.data,
    enabled: !!detailModalPetId,
    staleTime: 5 * 60 * 1000,
  });

  // 클러치 이력 통계
  const {
    statistics: pairStatistics,
    isLoading: isPairStatsLoading,
    hasPair,
  } = usePairStatistics(selectedNodes[0], selectedNodes[1], selectedPetA?.sex, selectedPetB?.sex);

  // 패널에 표시할 노드: hover 중이면 hover, 아니면 클릭으로 고정된 노드
  const panelSourceId = hoveredPetId ?? panelPetId;
  const hoveredNodeData = panelSourceId ? nodesMap.get(panelSourceId) : null;
  const hoveredPet = hoveredNodeData?.pet ?? null;
  const hoveredFather = hoveredNodeData?.fatherId
    ? (nodesMap.get(hoveredNodeData.fatherId)?.pet ?? null)
    : null;
  const hoveredMother = hoveredNodeData?.motherId
    ? (nodesMap.get(hoveredNodeData.motherId)?.pet ?? null)
    : null;

  // 선택된 두 개체의 부모 역할 결정 (메이팅/산란 추가 시 사용)
  const { pairFatherId, pairMotherId, pairFather, pairMother } = useMemo(() => {
    if (!selectedNodes[0] || !selectedNodes[1])
      return {
        pairFatherId: undefined,
        pairMotherId: undefined,
        pairFather: undefined,
        pairMother: undefined,
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

  // 트리에서 두 개체의 자식 목록
  const pairChildren: PairChildInfo[] = useMemo(() => {
    if (!pairFatherId || !pairMotherId) return [];
    const result: PairChildInfo[] = [];
    for (const node of visibleNodes) {
      if (
        (node.fatherId === pairFatherId && node.motherId === pairMotherId) ||
        (node.fatherId === pairMotherId && node.motherId === pairFatherId)
      ) {
        result.push({
          petId: node.petId,
          name: node.pet?.name,
          sex: node.pet?.sex,
          morphs: node.pet?.morphs,
        });
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairFatherId, pairMotherId, nodeKey]);

  // 산란 추가 모달용 메이팅 목록 (PairDetailContent 와 동일 로직: 정방향 우선, 없으면 역방향)
  const { data: pairMatingsByDate } = useQuery({
    queryKey: ["pair-matings-for-laying", pairFatherId, pairMotherId],
    queryFn: async () => {
      const [fwd, rev] = await Promise.all([
        pairControllerGetPairList({ fatherId: pairFatherId!, motherId: pairMotherId! }),
        pairControllerGetPairList({ fatherId: pairMotherId!, motherId: pairFatherId! }),
      ]);
      const fwdData = fwd.data.data ?? [];
      if (fwdData.length > 0) return fwdData[0]!.matingsByDate;
      const revData = rev.data.data ?? [];
      if (revData.length > 0) return revData[0]!.matingsByDate;
      return [];
    },
    enabled: !!pairFatherId && !!pairMotherId,
    staleTime: 5 * 60 * 1000,
  });

  // 산란 추가 모달용 메이팅 날짜/시즌 계산
  const matingDatesForCalendar = useMemo(
    () => (pairMatingsByDate ?? []).map((m) => m.matingDate).filter(Boolean) as string[],
    [pairMatingsByDate],
  );
  const latestMatingSeasonForCalendar = useMemo(() => {
    const seasons = (pairMatingsByDate ?? [])
      .map((m) => m.season)
      .filter((s): s is number => s != null);
    return seasons.length > 0 ? Math.max(...seasons) : undefined;
  }, [pairMatingsByDate]);

  const handleAddMating = useCallback(
    async (matingDate: string, season: number) => {
      if (!pairFatherId || !pairMotherId) return;
      const species = (pairFather?.species ??
        pairMother?.species ??
        "CRESTED") as CreateMatingDtoSpecies;
      await matingControllerCreateMating({
        fatherId: pairFatherId,
        motherId: pairMotherId,
        matingDate,
        season,
        species,
      });
      addPairEdge(pairFatherId, pairMotherId);
      invalidatePair();
      queryClient.invalidateQueries({ queryKey: ["family-tree", petId] });
    },
    [
      pairFatherId,
      pairMotherId,
      pairFather?.species,
      pairMother?.species,
      addPairEdge,
      queryClient,
      petId,
      invalidatePair,
    ],
  );

  const handleAddLaying = useCallback(() => {
    setShowLayingModal(true);
  }, []);

  // 번식 이력 상세 모달 (PairCard)
  const handleViewPairDetail = useCallback(() => {
    if (!pairFatherId || !pairMotherId) return;
    const fId = pairFatherId;
    const mId = pairMotherId;
    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="mt-[-10px] h-[90vh] max-h-[700px] max-w-xl overflow-y-auto rounded-2xl">
          <VisuallyHidden>
            <DialogTitle>번식 이력</DialogTitle>
          </VisuallyHidden>
          <PairDetailContent
            fatherId={fId}
            motherId={mId}
            onDataChange={async () => {
              invalidatePair();
              queryClient.invalidateQueries({ queryKey: ["family-tree", petId] });
              // 메이팅이 모두 삭제됐으면 pair 엣지 제거
              try {
                const [fwd, rev] = await Promise.all([
                  pairControllerGetPairList({ fatherId: fId, motherId: mId }),
                  pairControllerGetPairList({ fatherId: mId, motherId: fId }),
                ]);
                const fwdData = fwd.data.data ?? [];
                const revData = rev.data.data ?? [];
                const hasMating = [...fwdData, ...revData].some(
                  (p) => (p.matingsByDate?.length ?? 0) > 0,
                );
                if (!hasMating) {
                  removePairEdge(fId, mId);
                }
              } catch {
                // 실패 시 무시 (family tree refetch가 처리)
              }
            }}
          />
        </DialogContent>
      </Dialog>
    ));
  }, [pairFatherId, pairMotherId, queryClient, petId, invalidatePair, removePairEdge]);

  // 검색 결과 (보이는 노드 내에서 이름 매칭)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return visibleNodes.filter((n) => n.pet?.name?.toLowerCase().includes(q)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, nodeKey]);

  // 외부 개체 검색 — 공개 펫(ALL) + 내 비공개 펫(MY) 병렬 조회
  const enabled = searchQuery.trim().length >= 1;
  const [
    { data: publicSearchRes, isFetching: isFetchingPublic },
    { data: mySearchRes, isFetching: isFetchingMy },
  ] = useQueries({
    queries: [
      {
        queryKey: ["pet-search-external", "ALL", searchQuery],
        queryFn: () => petControllerFindAll({ keyword: searchQuery.trim(), itemPerPage: 5 }),
        enabled,
        staleTime: 30 * 1000,
      },
      {
        queryKey: ["pet-search-external", "MY", searchQuery],
        queryFn: () =>
          petControllerFindAll({ keyword: searchQuery.trim(), itemPerPage: 5, filterType: "MY" }),
        enabled,
        staleTime: 30 * 1000,
      },
    ],
  });
  const isExternalFetching = isFetchingPublic || isFetchingMy;

  const externalResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const publicPets = publicSearchRes?.data?.data ?? [];
    const myPets = mySearchRes?.data?.data ?? [];
    // 중복 제거 후 합산, 트리에 없는 개체만
    const seen = new Set<string>();
    const merged = [...myPets, ...publicPets].filter((p) => {
      if (seen.has(p.petId) || nodesMap.has(p.petId)) return false;
      seen.add(p.petId);
      return true;
    });
    return merged.slice(0, 5);
  }, [publicSearchRes, mySearchRes, searchQuery, nodesMap]);

  const handleSearchSelect = useCallback((nodeId: string) => {
    setFocusNodeId(nodeId);
    setSearchQuery(""); // 쿼리 초기화 → searchResults 빈 배열 → 드롭다운 자동 닫힘
    // searchFocused는 건드리지 않음: input focus가 유지된 상태에서 setSearchFocused(false) 후
    // 재클릭해도 onFocus가 다시 발동되지 않는 문제 방지
  }, []);

  const handleAddExternalTree = useCallback(
    async (targetPetId: string) => {
      setAddingPetId(targetPetId);
      try {
        const response = await queryClient.fetchQuery({
          queryKey: ["family-tree-expand", targetPetId],
          queryFn: () => petControllerGetFamilyTree(targetPetId, { depth: 2 }),
          staleTime: 5 * 60 * 1000,
        });
        const data = response.data as unknown as FamilyTreeResponse;
        mergeTree(targetPetId, data.nodes, data.centerPairPartnerIds ?? []);
        setSearchQuery("");
        // 시뮬레이션이 정착된 뒤 포커스 (노드 위치가 null인 상태에서 포커스 불가)
        setTimeout(() => setFocusNodeId(targetPetId), 1500);
      } catch {
        // 실패 시 무시
      } finally {
        setAddingPetId(null);
      }
    },
    [queryClient, mergeTree],
  );

  const handleFocusAncestor = useCallback(
    (petId: string) => {
      if (nodesMap.has(petId)) {
        // 같은 노드를 연속 클릭해도 useEffect가 재실행되도록 null → petId 순서로 set
        setFocusNodeId(null);
        setTimeout(() => setFocusNodeId(petId), 0);
      } else {
        handleAddExternalTree(petId);
      }
    },
    [nodesMap, handleAddExternalTree],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const total = searchResults.length + externalResults.length;
      if (e.key === "Escape") {
        setSearchQuery("");
        setHighlightedIndex(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        // -1(미선택)이면 첫 번째, 마지막이면 첫 번째로 순환
        setHighlightedIndex((i) => (i < 0 || i >= total - 1 ? 0 : i + 1));
      } else if (e.key === "ArrowUp" && total > 0) {
        e.preventDefault();
        // -1(미선택)이면 마지막, 첫 번째이면 마지막으로 순환
        setHighlightedIndex((i) => (i <= 0 ? total - 1 : i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          handleSearchSelect(searchResults[highlightedIndex]!.petId);
          setHighlightedIndex(-1);
        } else if (highlightedIndex >= searchResults.length && highlightedIndex < total) {
          const ext = externalResults[highlightedIndex - searchResults.length];
          if (ext) handleAddExternalTree(ext.petId);
          setHighlightedIndex(-1);
        } else if (searchResults[0]) {
          handleSearchSelect(searchResults[0].petId);
        }
      }
    },
    [searchResults, externalResults, highlightedIndex, handleSearchSelect, handleAddExternalTree],
  );

  // 검색어 변경 시 하이라이트 초기화
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

  if (isCenterLoading || isTreeLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <ForceGraph
        nodes={filteredGraphNodes}
        links={filteredGraphLinks}
        className="h-full w-full"
        selectedNodeIds={selectedNodes}
        highlightSelected={isPanelHovered && selectedNodes.length === 2}
        highlightedEdges={coiHighlightedEdges}
        highlightedChildIds={isPanelHovered ? pairChildren.map((c) => c.petId) : undefined}
        focusNodeId={focusNodeId}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeHover={(nodeId) => {
          setHoveredPetId(nodeId);
          if (nodeId) setPanelPetId(nodeId);
        }}
        onNodeContextMenu={handleNodeContextMenu}
        onCanvasClick={handleCanvasContextMenu}
        initialNodePositions={initialNodePositions}
      />

      {/* 중심 개체 이름 (상단 중앙) */}
      {centerPet && (
        <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2">
          <div className="bg-background/80 border-border flex items-center gap-1.5 rounded-lg border px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  centerPet.sex === "M" ? "#2383E2" : centerPet.sex === "F" ? "#E03E3E" : "#9ca3af",
              }}
            />
            <span className="text-sm font-medium">{centerPet.name ?? "이름 없음"}</span>
            <span className="text-muted-foreground text-xs">의 가계도</span>
          </div>
        </div>
      )}

      {/* 검색 + 성별 필터 (좌측 상단) */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            onKeyDown={handleSearchKeyDown}
            placeholder="개체 검색..."
            className="border-border bg-background/80 placeholder:text-muted-foreground focus:ring-primary w-52 rounded-lg border px-3 py-1.5 text-sm backdrop-blur-sm focus:ring-1 focus:outline-none"
          />
          {/* 성별 필터 */}
          <SingleSelect
            type="sex"
            initialItem={sexFilter}
            onSelect={(v: "M" | "F" | null) => setSexFilter(v)}
            showTitle
            showSelectAll
            variant="light"
          />
        </div>
        {searchFocused &&
          isExternalFetching &&
          searchResults.length === 0 &&
          externalResults.length === 0 && (
            <div className="border-border bg-background/95 w-52 rounded-lg border px-3 py-2 text-xs text-gray-400 shadow-md backdrop-blur-sm">
              검색 중...
            </div>
          )}
        {searchFocused && (searchResults.length > 0 || externalResults.length > 0) && (
          <div className="border-border bg-background/95 w-52 rounded-lg border py-1 shadow-md backdrop-blur-sm">
            {/* 트리 내 결과 */}
            {searchResults.length > 0 && (
              <>
                {externalResults.length > 0 && (
                  <div className="px-3 pt-1 pb-0.5 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                    트리 내
                  </div>
                )}
                {searchResults.map((n, i) => (
                  <button
                    key={n.petId}
                    className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-sm ${highlightedIndex === i ? "bg-accent" : "hover:bg-accent"}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSearchSelect(n.petId);
                    }}
                  >
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          n.pet?.sex === "M" || n.pet?.sex === "MALE"
                            ? "#2383E2"
                            : n.pet?.sex === "F" || n.pet?.sex === "FEMALE"
                              ? "#E03E3E"
                              : "#9ca3af",
                      }}
                    />
                    <span className="truncate">{n.pet?.name ?? "이름 없음"}</span>
                  </button>
                ))}
              </>
            )}
            {/* 외부 결과 (트리에 없는 개체) */}
            {externalResults.length > 0 && (
              <>
                <div className="px-3 pt-1 pb-0.5 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                  트리에 추가
                </div>
                {externalResults.map((p, i) => (
                  <div
                    key={p.petId}
                    className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-sm ${highlightedIndex === searchResults.length + i ? "bg-accent" : "hover:bg-accent"}`}
                  >
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          p.sex === PetDtoSex.MALE
                            ? "#2383E2"
                            : p.sex === PetDtoSex.FEMALE
                              ? "#E03E3E"
                              : "#9ca3af",
                      }}
                    />
                    <span className="flex-1 truncate">{p.name ?? "이름 없음"}</span>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddExternalTree(p.petId);
                      }}
                      disabled={addingPetId === p.petId}
                      className="shrink-0 rounded px-1.5 py-0.5 text-xs text-blue-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 dark:hover:bg-blue-900/30"
                    >
                      {addingPetId === p.petId ? "..." : "+ 추가"}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* 컨텍스트 메뉴 + 백드롭 */}
      {canvasContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setCanvasContextMenu(null)} />
          <div
            className="fixed z-50 min-w-[140px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            style={{ left: canvasContextMenu.position.x, top: canvasContextMenu.position.y }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => {
                setCanvasContextMenu(null);
                setShowQuickRegister(true);
              }}
            >
              새 개체 등록
            </button>
          </div>
        </>
      )}

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setContextMenu(null)} />
          <NodeContextMenu
            nodeId={contextMenu.nodeId}
            nodeName={nodesMap.get(contextMenu.nodeId)?.pet?.name ?? "이름 없음"}
            isPrivate={(() => {
              const n = nodesMap.get(contextMenu.nodeId);
              return n?.isHidden || (n?.pet?.isPublic === false && !n?.pet?.isOwner);
            })()}
            isOwner={nodesMap.get(contextMenu.nodeId)?.pet?.isOwner ?? false}
            nodeSex={nodesMap.get(contextMenu.nodeId)?.pet?.sex ?? undefined}
            position={contextMenu.position}
            onAction={handleContextMenuAction}
            onClose={() => setContextMenu(null)}
          />
        </>
      )}

      {/* 개체 상세 모달 */}
      {detailPet && (
        <PetDetailModal isOpen={!!detailPet} pet={detailPet} onClose={handleModalClose} />
      )}

      {/* 산란 추가 모달 */}
      <CreateLayingModal
        isOpen={showLayingModal}
        onClose={() => {
          setShowLayingModal(false);
          queryClient.invalidateQueries({ queryKey: ["family-tree", petId] });
        }}
        fatherId={pairFatherId}
        motherId={pairMotherId}
        matingsByDate={pairMatingsByDate}
      />

      {/* 빠른 개체 등록 모달 */}
      <QuickRegisterModal
        isOpen={showQuickRegister}
        onClose={() => setShowQuickRegister(false)}
        onSuccess={async (newPetId: string) => {
          if (quickRegisterSimPosition) {
            setInitialNodePositions({ [newPetId]: quickRegisterSimPosition });
          }
          try {
            const response = await queryClient.fetchQuery({
              queryKey: ["family-tree-expand", newPetId],
              queryFn: () => petControllerGetFamilyTree(newPetId, { depth: 2 }),
              staleTime: 5 * 60 * 1000,
            });
            const data = response.data as unknown as FamilyTreeResponse;
            mergeTree(newPetId, data.nodes, data.centerPairPartnerIds ?? []);
            setTimeout(() => setFocusNodeId(newPetId), 1500);
          } catch {
            queryClient.invalidateQueries({ queryKey: ["family-tree", petId] });
          }
          setQuickRegisterSimPosition(null);
        }}
      />

      {/* 모프 범례 + 깊이 안내 (좌측 하단) */}
      <div className="absolute bottom-3 left-3">
        <MorphLegend morphs={visibleMorphs} />
      </div>

      {/* 우측 패널 영역 */}
      <div className="absolute top-3 right-3 flex max-h-[calc(100dvh-1.5rem)] flex-col gap-2 overflow-y-auto">
        <PetDetailPanel
          key={panelSourceId ?? "empty"}
          pet={hoveredPet}
          father={hoveredFather}
          mother={hoveredMother}
          onAction={handleContextMenuAction}
        />
        <div
          onMouseEnter={() => setIsPanelHovered(true)}
          onMouseLeave={() => setIsPanelHovered(false)}
          className="flex flex-col gap-2"
        >
          <CoiPanel
            pets={coiPets}
            coi={coi}
            level={coiLevel}
            commonAncestors={commonAncestors}
            equivalentRelation={equivalentRelation}
            isLoading={isCoiLoading}
            isReady={selectedNodes.length === 2}
            onClear={() => setSelectedNodes([])}
            onClearPet={(id) => setSelectedNodes((prev) => prev.filter((p) => p !== id))}
            onFocusAncestor={handleFocusAncestor}
            onSelectMate={
              selectedNodes.length <= 1
                ? (role) => {
                    const sex = role === "부" ? PetDtoSex.MALE : PetDtoSex.FEMALE;
                    handleSelectPetForCoi(sex);
                  }
                : undefined
            }
          />
          {selectedNodes.length === 2 && selectedPetA && selectedPetB && (
            <OffspringPredictionPanel
              morphsA={selectedPetA.morphs ?? []}
              morphsB={selectedPetB.morphs ?? []}
              nameA={selectedPetA.name ?? "이름 없음"}
              nameB={selectedPetB.name ?? "이름 없음"}
            />
          )}
          {selectedNodes.length === 2 && (
            <PairStatisticsPanel
              statistics={pairStatistics}
              isLoading={isPairStatsLoading}
              hasPair={hasPair}
              isOpposite={isMaleFemale}
              isBothOwned={isBothOwned}
              onAddMating={handleAddMating}
              matingDates={matingDatesForCalendar}
              latestSeason={latestMatingSeasonForCalendar}
              onAddLaying={handleAddLaying}
              onExpand={handleViewPairDetail}
              pairChildren={pairChildren}
              onChildClick={(childId) => {
                setFocusNodeId(null);
                setTimeout(() => setFocusNodeId(childId), 0);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
