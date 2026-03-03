"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { petControllerFindPetByPetId, petControllerGetFamilyTree } from "@repo/api-client";
import ForceGraph from "./ForceGraph";
import PetDetailPanel from "./PetDetailPanel";
import CoiPanel from "./CoiPanel";
import PairStatisticsPanel from "./PairStatisticsPanel";
import MorphLegend from "./MorphLegend";
import SearchDropdown from "./SearchDropdown";
import CreateLayingModal from "../../../../hatching/components/CreateLayingModal";
import PetDetailModal from "../../components/PetDetailModal";
import { useFamilyTree, type FamilyTreeResponse } from "../hooks/useFamilyTreeData";
import { usePairInvalidate } from "../../../../hatching/hooks/usePairInvalidate";
import { useGraphTransform } from "../hooks/useGraphTransform";
import { useSearch } from "../hooks/useSearch";
import { useCoiSelection } from "../hooks/useCoiSelection";
import { usePairActions } from "../hooks/usePairActions";
import { useFamilyTreeStore } from "../store/familyTreeStore";
import { useShallow } from "zustand/react/shallow";
import Loading from "@/components/common/Loading";
import { useIsMobile } from "@/hooks/useMobile";
import { toast } from "@/lib/toast";
import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import QuickRegisterModal from "./QuickRegisterModal";
import { ChevronUp, X } from "lucide-react";

interface FamilyTreeCanvasProps {
  petId: string;
}

export default function FamilyTreeCanvas({ petId }: FamilyTreeCanvasProps) {
  const {
    centerPetId,
    nodesMap,
    edgesMap,
    expandedNodeIds,
    externalTreeRootIds,
    setFamilyTree,
    mergeTree,
    getGenerationMap,
    updateNodePet,
    addPairEdge,
    removePairEdge,
    addExternalTreeRoot,
  } = useFamilyTreeStore(
    useShallow((s) => ({
      centerPetId: s.centerPetId,
      nodesMap: s.nodesMap,
      edgesMap: s.edgesMap,
      expandedNodeIds: s.expandedNodeIds,
      externalTreeRootIds: s.externalTreeRootIds,
      setFamilyTree: s.setFamilyTree,
      mergeTree: s.mergeTree,
      getGenerationMap: s.getGenerationMap,
      updateNodePet: s.updateNodePet,
      addPairEdge: s.addPairEdge,
      removePairEdge: s.removePairEdge,
      addExternalTreeRoot: s.addExternalTreeRoot,
    })),
  );

  const queryClient = useQueryClient();
  const invalidatePair = usePairInvalidate();
  const [hoveredPetId, setHoveredPetId] = useState<string | null>(null);
  const [panelPetId, setPanelPetId] = useState<string | null>(petId);
  const [detailModalPetId, setDetailModalPetId] = useState<string | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{
    position: { x: number; y: number };
  } | null>(null);
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const [showLayingModal, setShowLayingModal] = useState(false);
  const [sexFilter, setSexFilter] = useState<"M" | "F" | "NONE" | null>(null);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickRegisterSimPosition, setQuickRegisterSimPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [initialNodePositions, setInitialNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const reshuffleRef = useRef<(() => void) | null>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const chipDrag = useRef({ isDown: false, startX: 0, scrollLeft: 0 });
  const isMobile = useIsMobile();
  const panelContentRef = useRef<HTMLDivElement>(null);
  const pairStatsPanelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const isDragging = useRef(false);
  const [isPanelDismissed, setIsPanelDismissed] = useState(false);
  const maxPanelH = typeof window !== "undefined" ? window.innerHeight * 0.4 : 300; // 40dvh

  const handlePanelTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0]!.clientY;
    isDragging.current = true;
    const content = panelContentRef.current;
    if (content) {
      dragStartHeight.current = content.offsetHeight;
      content.style.transition = "none";
    }
  }, []);

  const handlePanelTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;
      const content = panelContentRef.current;
      if (!content) return;
      const delta = e.touches[0]!.clientY - dragStartY.current;
      const newHeight = Math.max(0, Math.min(dragStartHeight.current - delta, maxPanelH));
      content.style.height = `${newHeight}px`;
    },
    [maxPanelH],
  );

  const handlePanelTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const content = panelContentRef.current;
    if (!content) return;

    const currentH = content.offsetHeight;
    const downDelta = currentH === 0 ? dragStartHeight.current : dragStartHeight.current - currentH;

    // 이미 0인 상태에서 시작했고 아래로 80px 이상 드래그 → 완전 숨김
    if (dragStartHeight.current <= 0) {
      setIsPanelDismissed(true);
      return;
    }

    content.style.transition = "height 0.2s ease";
    // 강한 아래 드래그 (시작 높이의 80% 이상 줄임) → 완전 숨김
    if (downDelta > dragStartHeight.current * 0.8 && dragStartHeight.current > 50) {
      content.style.height = "0px";
      const dismissAfterCollapse = () => {
        setIsPanelDismissed(true);
        content.removeEventListener("transitionend", dismissAfterCollapse);
      };
      content.addEventListener("transitionend", dismissAfterCollapse);
      return;
    }

    if (currentH < 30) {
      content.style.height = "0px";
    }
    const cleanup = () => {
      content.style.transition = "";
      content.removeEventListener("transitionend", cleanup);
    };
    content.addEventListener("transitionend", cleanup);
  }, []);

  const handleRestorePanel = useCallback(() => {
    setIsPanelDismissed(false);
    // 복원 시 콘텐츠 높이를 max로
    requestAnimationFrame(() => {
      const content = panelContentRef.current;
      if (content) {
        content.style.height = `${maxPanelH}px`;
      }
    });
  }, [maxPanelH]);

  // 브리딩맵 전체 데이터 fetch (Recursive CTE)
  const { data: familyTreeNodes, isLoading: isTreeLoading } = useFamilyTree(petId);

  // 브리딩맵 데이터 로드 시 스토어 초기화
  useEffect(() => {
    if (familyTreeNodes) {
      setFamilyTree(petId, familyTreeNodes.nodes, familyTreeNodes.centerPairPartnerIds ?? []);
    }
  }, [familyTreeNodes, petId, setFamilyTree]);

  // 그래프 데이터 변환 파이프라인
  const {
    visibleNodes,
    thumbnailMap,
    nodeKey,
    filteredGraphNodes,
    filteredGraphLinks,
    visibleMorphs,
  } = useGraphTransform({ nodesMap, edgesMap, centerPetId, getGenerationMap, petId, sexFilter });

  // 검색 + 외부 개체 추가 + 포커스
  const {
    searchQuery,
    setSearchQuery,
    searchFocused,
    setSearchFocused,
    focusNodeId,
    setFocusNodeId,
    highlightedIndex,
    addingPetId,
    searchResults,
    externalResults,
    isExternalFetching,
    handleSearchSelect,
    handleAddExternalTree,
    handleFocusAncestor,
    handleSearchKeyDown,
  } = useSearch({ nodesMap, nodeKey, queryClient, mergeTree, addExternalTreeRoot });

  const handleCanvasContextMenu = useCallback(
    (position: { x: number; y: number }, simPosition?: { x: number; y: number }) => {
      setCanvasContextMenu({ position });
      setQuickRegisterSimPosition(simPosition ?? null);
    },
    [],
  );

  // COI 선택 + 메이트 선택 + 페어 역할
  const {
    selectedNodes,
    handleNodeDoubleClick,
    handleSelectMate,
    coi,
    coiLevel,
    commonAncestors,
    equivalentRelation,
    isCoiLoading,
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
  } = useCoiSelection({
    nodesMap,
    petId,
    queryClient,
    mergeTree,
    addPairEdge,
    invalidatePair,
    thumbnailMap,
  });

  const handleContextMenuAction = useCallback(
    (action: string, nodeId: string) => {
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
          window.open(`/pet/${nodeId}/relation`, "_blank");
          break;
        case "family-tree":
          window.open(`/pet/${nodeId}/breeding-map`, "_blank");
          break;
      }
    },
    [nodesMap, handleSelectMate],
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

      // 타인 소유 개체는 트리 확장 불가
      if (nodeData?.pet && !nodeData.pet.isOwner) {
        toast.info("타인의 개체입니다.", { position: "bottom-center" });
        return;
      }

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
          toast.info("추가로 표시할 개체가 없습니다.", { position: "bottom-center" });
        }
      } catch {
        // 실패 시 무시
      }
    },
    [centerPetId, expandedNodeIds, mergeTree, queryClient, nodesMap, setPanelPetId],
  );

  // 개체 상세 모달 닫기 → 변경된 pet 데이터로 노드 업데이트
  const handleModalClose = useCallback(async () => {
    if (!detailModalPetId) return;
    const closingPetId = detailModalPetId;
    setDetailModalPetId(null);
    // 브리딩맵 쿼리 무효화 → 새 자식 노드 반영
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
  });

  // 번식 이력 통계 + 메이팅/산란 핸들러
  const {
    pairStatistics,
    isPairStatsLoading,
    hasPair,
    pairChildren,
    pairMatingsByDate,
    matingDatesForCalendar,
    latestMatingSeasonForCalendar,
    handleAddMating,
    handleViewPairDetail,
  } = usePairActions({
    pairFatherId,
    pairMotherId,
    pairFather,
    pairMother,
    selectedNodes,
    selectedPetA,
    selectedPetB,
    visibleNodes,
    nodeKey,
    addPairEdge,
    removePairEdge,
    invalidatePair,
    queryClient,
    petId,
  });

  // 패널에 표시할 노드: hover 중이면 hover, 아니면 클릭으로 고정된 노드
  const panelSourceId = hoveredPetId ?? panelPetId;
  const { hoveredPet, hoveredFather, hoveredMother } = useMemo(() => {
    const nodeData = panelSourceId ? (nodesMap.get(panelSourceId) ?? null) : null;
    return {
      hoveredPet: nodeData?.pet ?? null,
      hoveredFather: nodeData?.fatherId ? (nodesMap.get(nodeData.fatherId)?.pet ?? null) : null,
      hoveredMother: nodeData?.motherId ? (nodesMap.get(nodeData.motherId)?.pet ?? null) : null,
    };
  }, [panelSourceId, nodesMap]);

  const handleAddLaying = useCallback(() => {
    setShowLayingModal(true);
  }, []);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredPetId(nodeId);
  }, []);

  const handleChildClick = useCallback((childId: string) => {
    setFocusNodeId(null);
    setTimeout(() => setFocusNodeId(childId), 0);
  }, []);

  const handleFocusNode = useCallback((nodeId: string) => {
    setPanelPetId(nodeId);
    setFocusNodeId(null);
    setTimeout(() => setFocusNodeId(nodeId), 0);
  }, []);

  // 외부 트리 삭제: 센터 트리 초기화 후 남은 외부 트리 재병합
  const handleRemoveExternalTree = useCallback(
    async (rootId: string) => {
      // 센터 트리 캐시로 초기화 (useFamilyTree 쿼리 키: ["family-tree", petId, 2, 2])
      const centerCache = queryClient.getQueryData<FamilyTreeResponse>([
        "family-tree",
        petId,
        2,
        2,
      ]);
      if (!centerCache) return;
      setFamilyTree(petId, centerCache.nodes, centerCache.centerPairPartnerIds ?? []);

      // 삭제 대상 제외한 나머지 외부 트리 재병합
      const remaining = externalTreeRootIds.filter((id) => id !== rootId);
      for (const extId of remaining) {
        const cache = queryClient.getQueryData<
          Awaited<ReturnType<typeof petControllerGetFamilyTree>>
        >(["family-tree-expand", extId]);
        if (cache) {
          const data = cache.data;
          mergeTree(extId, data.nodes, data.centerPairPartnerIds ?? []);
          addExternalTreeRoot(extId);
        }
      }
    },
    [queryClient, petId, setFamilyTree, externalTreeRootIds, mergeTree, addExternalTreeRoot],
  );

  // 중심 개체 데이터 (트리 데이터에서 파생)
  const centerPet = nodesMap.get(petId)?.pet ?? null;

  if (isTreeLoading) {
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
        highlightedChildIds={isPanelHovered ? pairChildren.map((c) => c.petId) : undefined}
        focusNodeId={focusNodeId}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeHover={handleNodeHover}
        onCanvasClick={handleCanvasContextMenu}
        initialNodePositions={initialNodePositions}
        onReshuffleReady={(fn) => {
          reshuffleRef.current = fn;
        }}
      />

      {/* 트리 칩 리스트 — 검색바 우측 나머지 영역 */}
      {centerPet && (
        <div
          ref={chipScrollRef}
          className={`absolute z-10 cursor-grab overflow-x-auto active:cursor-grabbing ${
            isMobile ? "top-2 right-2 left-[245px]" : "top-4 right-[232px] left-[300px]"
          }`}
          onMouseDown={(e) => {
            const el = chipScrollRef.current;
            if (!el) return;
            chipDrag.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
          }}
          onMouseLeave={() => { chipDrag.current.isDown = false; }}
          onMouseUp={() => { chipDrag.current.isDown = false; }}
          onMouseMove={(e) => {
            const d = chipDrag.current;
            if (!d.isDown) return;
            e.preventDefault();
            const el = chipScrollRef.current!;
            const x = e.pageX - el.offsetLeft;
            el.scrollLeft = d.scrollLeft - (x - d.startX);
          }}
        >
          <div className="flex w-max gap-1 pb-1.5">
            {/* 센터 개체 (항상 표시, 삭제 불가) */}
            <button
              type="button"
              onClick={() => handleFocusNode(petId)}
              className="border-border flex shrink-0 items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-xs font-medium shadow-sm dark:bg-gray-900"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    centerPet.sex === "M"
                      ? "#2383E2"
                      : centerPet.sex === "F"
                        ? "#E03E3E"
                        : "#9ca3af",
                }}
              />
              <span className="max-w-[80px] truncate">{centerPet.name ?? "이름 없음"}</span>
            </button>
            {/* 외부 트리 (삭제 가능) */}
            {externalTreeRootIds.map((rootId) => {
              const rootPet = nodesMap.get(rootId)?.pet;
              return (
                <div
                  key={rootId}
                  className="border-border flex shrink-0 items-center gap-1.5 rounded-full border bg-gray-100 px-2.5 py-1 text-xs dark:bg-gray-800"
                >
                  <button
                    type="button"
                    onClick={() => handleFocusNode(rootId)}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          rootPet?.sex === "M"
                            ? "#2383E2"
                            : rootPet?.sex === "F"
                              ? "#E03E3E"
                              : "#9ca3af",
                      }}
                    />
                    <span className="max-w-[80px] truncate">{rootPet?.name ?? "이름 없음"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveExternalTree(rootId)}
                    className="text-muted-foreground hover:text-destructive -mr-0.5 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 검색 + 성별 필터 (좌측 상단) */}
      <div
        className={`absolute z-20 flex flex-col gap-1 ${isMobile ? "top-1 left-1" : "top-3 left-3"}`}
      >
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            onKeyDown={handleSearchKeyDown}
            placeholder="개체 검색..."
            className={`border-border bg-background/80 placeholder:text-muted-foreground focus:ring-primary ${isMobile ? "w-40" : "w-52"} rounded-lg border px-3 py-1.5 text-sm backdrop-blur-sm focus:ring-1 focus:outline-none`}
          />
          {/* 성별 필터 */}
          <SingleSelect
            type="sex"
            initialItem={sexFilter}
            onSelect={(v: "M" | "F" | null) => setSexFilter(v)}
            showTitle
            showSelectAll
            hideTitleOnSelect
            variant="light"
          />
        </div>
        <SearchDropdown
          searchFocused={searchFocused}
          isExternalFetching={isExternalFetching}
          searchResults={searchResults}
          externalResults={externalResults}
          highlightedIndex={highlightedIndex}
          addingPetId={addingPetId}
          isMobile={isMobile}
          onSearchSelect={handleSearchSelect}
          onAddExternalTree={handleAddExternalTree}
        />
      </div>

      {/* 더블클릭 안내 힌트 */}
      <div
        className={`pointer-events-none absolute z-10 flex justify-center ${
          isMobile ? "top-10 right-0 left-0" : "top-12 right-0 left-0"
        }`}
      >
        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text px-3 py-1 text-sm font-medium text-transparent dark:from-blue-200 dark:to-purple-200">
          <svg width={14} height={14} viewBox="0 0 20 20" fill="none" className="shrink-0">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
            <text
              x="10"
              y="14.5"
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="currentColor"
            >
              i
            </text>
          </svg>
          개체를 더블클릭하면 페어 분석이 가능합니다.
        </span>
      </div>

      {/* 컨텍스트 메뉴 + 백드롭 */}
      {canvasContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onPointerDown={() => setCanvasContextMenu(null)} />
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
              새로운 개체 추가
            </button>
          </div>
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

      {/* 모프 범례 + 깊이 안내 (좌측 하단, 데스크톱만) */}
      {!isMobile && (
        <div className="absolute bottom-3 left-3">
          <MorphLegend morphs={visibleMorphs} />
        </div>
      )}

      {/* 위치 재배치 버튼 (데스크톱만) */}
      {/* {!isMobile && (
        <button
          type="button"
          onClick={() => reshuffleRef.current?.()}
          className="absolute right-3 bottom-3 z-10 rounded-lg border border-gray-300 bg-gray-600 px-3 py-1.5 text-xs text-white shadow-sm transition-colors hover:bg-gray-700 active:bg-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500"
          title="노드 위치 재배치"
        >
          재배치
        </button>
      )} */}

      {/* 패널 영역 — 데스크톱: 우측 상단, 모바일: 하단 시트 */}
      {isMobile && isPanelDismissed && (
        <button
          type="button"
          onClick={handleRestorePanel}
          className="absolute right-3 bottom-3 z-10 rounded-full bg-white/90 p-2.5 shadow-lg backdrop-blur-sm dark:bg-gray-800/90"
        >
          <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}
      {isMobile && !isPanelDismissed ? (
        <div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col rounded-t-3xl bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
          {/* 드래그 핸들 */}
          <div
            onTouchStart={handlePanelTouchStart}
            onTouchMove={handlePanelTouchMove}
            onTouchEnd={handlePanelTouchEnd}
            className="flex w-full touch-none items-center justify-center rounded-t-3xl border-t border-gray-200 bg-white/90 py-2.5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90"
          >
            <div className="h-1 w-10 rounded-full bg-gray-400 dark:bg-gray-500" />
          </div>
          {/* 패널 콘텐츠 */}
          <div
            ref={panelContentRef}
            className="grid grid-cols-2 gap-2 overflow-y-auto overscroll-contain bg-white/90 px-3 pb-3 backdrop-blur-sm dark:bg-gray-900/90"
            style={{ height: `${maxPanelH}px` }}
          >
            {selectedNodes.length === 2 && (
              <button
                type="button"
                className="col-span-2 flex items-center justify-center rounded-full border border-purple-300/60 bg-gradient-to-r from-blue-200/50 to-purple-200/65 px-3 py-1 shadow-sm active:from-blue-200/70 active:to-purple-200/85 dark:border-purple-700/50 dark:from-blue-900/40 dark:to-purple-900/50 dark:active:from-blue-900/60 dark:active:to-purple-900/70"
                onClick={() =>
                  pairStatsPanelRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  })
                }
              >
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xs font-semibold text-transparent dark:from-blue-400 dark:to-purple-400">
                  메이팅 정보 보기
                </span>
              </button>
            )}
            <PetDetailPanel
              key={panelSourceId ?? "empty"}
              pet={hoveredPet}
              father={hoveredFather}
              mother={hoveredMother}
              onAction={handleContextMenuAction}
              onFocusNode={handleFocusNode}
            />
            <div className="contents">
              <CoiPanel
                pets={coiPets}
                coi={coi}
                level={coiLevel}
                commonAncestors={commonAncestors}
                equivalentRelation={equivalentRelation}
                isLoading={isCoiLoading}
                isReady={selectedNodes.length === 2}
                onClear={handleCoiClear}
                onClearPet={handleCoiClearPet}
                onFocusAncestor={handleFocusAncestor}
                onSelectMate={selectedNodes.length <= 1 ? handleCoiSelectMate : undefined}
                hasSelection={selectedNodes.length > 0}
              />
              <MorphLegend morphs={visibleMorphs} />
              {selectedNodes.length === 2 && (
                <div ref={pairStatsPanelRef}>
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
                    onChildClick={handleChildClick}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : !isMobile ? (
        <div className="absolute top-3 right-3 -mx-2 -mb-3 flex max-h-[calc(100%-1.5rem)] flex-col gap-2 overflow-y-auto px-2 pb-5">
          <PetDetailPanel
            key={panelSourceId ?? "empty"}
            pet={hoveredPet}
            father={hoveredFather}
            mother={hoveredMother}
            onAction={handleContextMenuAction}
            onFocusNode={handleFocusNode}
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
              onClear={handleCoiClear}
              onClearPet={handleCoiClearPet}
              onFocusAncestor={handleFocusAncestor}
              onSelectMate={selectedNodes.length <= 1 ? handleCoiSelectMate : undefined}
              hasSelection={selectedNodes.length > 0}
            />
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
                onChildClick={handleChildClick}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
