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
import { useCenterPet, useFamilyTree, type FamilyTreeResponse } from "../hooks/useFamilyTreeData";
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

interface FamilyTreeCanvasProps {
  petId: string;
}

export default function FamilyTreeCanvas({ petId }: FamilyTreeCanvasProps) {
  const {
    centerPetId,
    nodesMap,
    edgesMap,
    expandedNodeIds,
    setFamilyTree,
    mergeTree,
    getGenerationMap,
    updateNodePet,
    addPairEdge,
    removePairEdge,
  } = useFamilyTreeStore(
    useShallow((s) => ({
      centerPetId: s.centerPetId,
      nodesMap: s.nodesMap,
      edgesMap: s.edgesMap,
      expandedNodeIds: s.expandedNodeIds,
      setFamilyTree: s.setFamilyTree,
      mergeTree: s.mergeTree,
      getGenerationMap: s.getGenerationMap,
      updateNodePet: s.updateNodePet,
      addPairEdge: s.addPairEdge,
      removePairEdge: s.removePairEdge,
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
  const isMobile = useIsMobile();

  // 중심 개체 fetch
  const { data: centerPet, isLoading: isCenterLoading } = useCenterPet(petId);

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
  } = useSearch({ nodesMap, nodeKey, queryClient, mergeTree });

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
    staleTime: 5 * 60 * 1000,
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
    if (nodeId) setPanelPetId(nodeId);
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

      {/* 중심 개체 이름 — 데스크톱: 상단 중앙, 모바일: 우측 상단 (재배치 버튼 자리) */}
      {centerPet && (
        <div
          className={
            isMobile
              ? "absolute top-1 right-1 z-10"
              : "absolute top-3 left-1/2 z-10 -translate-x-1/2"
          }
        >
          <div className="bg-background/80 border-border flex items-center gap-1.5 rounded-lg border px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  centerPet.sex === "M" ? "#2383E2" : centerPet.sex === "F" ? "#E03E3E" : "#9ca3af",
              }}
            />
            <span className="text-sm font-medium">{centerPet.name ?? "이름 없음"}</span>
            <span className="text-muted-foreground text-xs">의 브리딩맵</span>
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
              새 개체 등록
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
      <div
        className={
          isMobile
            ? "absolute right-0 bottom-0 left-0 z-10 grid max-h-[40dvh] grid-cols-2 gap-2 overflow-y-auto px-3 pb-3"
            : "absolute top-3 right-3 flex max-h-[calc(100%-1.5rem)] flex-col gap-2 overflow-y-auto"
        }
      >
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
          className={isMobile ? "contents" : "flex flex-col gap-2"}
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
          {/* {selectedNodes.length === 2 && selectedPetA && selectedPetB && (
            <OffspringPredictionPanel
              morphsA={selectedPetA.morphs ?? []}
              morphsB={selectedPetB.morphs ?? []}
              nameA={selectedPetA.name ?? "이름 없음"}
              nameB={selectedPetB.name ?? "이름 없음"}
            />
          )} */}
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
          {/* 모바일에서만 범례를 패널 그리드 안에 표시 */}
          {isMobile && <MorphLegend morphs={visibleMorphs} />}
        </div>
      </div>
    </div>
  );
}
