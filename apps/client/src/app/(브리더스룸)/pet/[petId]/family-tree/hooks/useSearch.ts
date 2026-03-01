import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueries, type QueryClient } from "@tanstack/react-query";
import { petControllerFindAll, petControllerGetFamilyTree } from "@repo/api-client";
import type { FamilyTreeNodeData } from "../lib/types";
import type { FamilyTreeResponse } from "./useFamilyTreeData";

interface UseSearchParams {
  nodesMap: Map<string, FamilyTreeNodeData>;
  nodeKey: string;
  queryClient: QueryClient;
  mergeTree: (petId: string, nodes: FamilyTreeResponse["nodes"], centerPairPartnerIds: string[]) => void;
}

export function useSearch({ nodesMap, nodeKey, queryClient, mergeTree }: UseSearchParams) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [addingPetId, setAddingPetId] = useState<string | null>(null);

  // 검색 결과 (보이는 노드 내에서 이름 매칭)
  const visibleNodes = useMemo(() => Array.from(nodesMap.values()), [nodesMap]);
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return visibleNodes.filter((n) => n.pet?.name?.toLowerCase().includes(q)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, nodeKey]);

  // 외부 개체 검색 — 공개 펫(ALL) + 내 비공개 펫(MY) 병렬 조회
  const enabled = searchQuery.trim().length >= 1;
  const [
    { data: publicPets, isFetching: isFetchingPublic },
    { data: myPets, isFetching: isFetchingMy },
  ] = useQueries({
    queries: [
      {
        queryKey: ["pet-search-external", "ALL", searchQuery],
        queryFn: () => petControllerFindAll({ keyword: searchQuery.trim(), itemPerPage: 5 }),
        select: (res: Awaited<ReturnType<typeof petControllerFindAll>>) => res.data.data ?? [],
        enabled,
        staleTime: 30 * 1000,
      },
      {
        queryKey: ["pet-search-external", "MY", searchQuery],
        queryFn: () =>
          petControllerFindAll({ keyword: searchQuery.trim(), itemPerPage: 5, filterType: "MY" }),
        select: (res: Awaited<ReturnType<typeof petControllerFindAll>>) => res.data.data ?? [],
        enabled,
        staleTime: 30 * 1000,
      },
    ],
  });
  const isExternalFetching = isFetchingPublic || isFetchingMy;

  const externalResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const seen = new Set<string>();
    const merged = [...(myPets ?? []), ...(publicPets ?? [])].filter((p) => {
      if (seen.has(p.petId) || nodesMap.has(p.petId)) return false;
      seen.add(p.petId);
      return true;
    });
    return merged.slice(0, 5);
  }, [publicPets, myPets, searchQuery, nodesMap]);

  const handleSearchSelect = useCallback((nodeId: string) => {
    setFocusNodeId(nodeId);
    setSearchQuery("");
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
        setHighlightedIndex((i) => (i < 0 || i >= total - 1 ? 0 : i + 1));
      } else if (e.key === "ArrowUp" && total > 0) {
        e.preventDefault();
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

  return {
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
  };
}
