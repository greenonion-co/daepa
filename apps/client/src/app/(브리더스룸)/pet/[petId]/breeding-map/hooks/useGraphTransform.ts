import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { petImageControllerFindThumbnail } from "@repo/api-client";
import { buildR2TransformedUrl } from "@/lib/utils";
import { IMAGE_TRANSFORMS } from "@/app/constants";
import type { FamilyTreeNodeData, GraphNode, GraphLink } from "../lib/types";
import type { FamilyEdge } from "../lib/graph-utils";

interface UseGraphTransformParams {
  nodesMap: Map<string, FamilyTreeNodeData>;
  edgesMap: Map<string, FamilyEdge>;
  centerPetId: string;
  getGenerationMap: () => Map<string, number>;
  petId: string;
  sexFilter: "M" | "F" | "NONE" | null;
}

export function useGraphTransform({
  nodesMap,
  edgesMap,
  centerPetId,
  getGenerationMap,
  petId,
  sexFilter,
}: UseGraphTransformParams) {
  const visibleNodes = useMemo(() => Array.from(nodesMap.values()), [nodesMap]);
  const visibleEdges = useMemo(() => Array.from(edgesMap.values()), [edgesMap]);
  const generationMap = useMemo(
    () => getGenerationMap(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodesMap, edgesMap, centerPetId],
  );

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

  // 성별 필터 적용
  const { filteredGraphNodes, filteredGraphLinks } = useMemo(() => {
    if (!sexFilter) return { filteredGraphNodes: graphNodes, filteredGraphLinks: graphLinks };

    const matchesSex = (sex?: string) => {
      if (sexFilter === "M") return sex === "M" || sex === "MALE";
      if (sexFilter === "F") return sex === "F" || sex === "FEMALE";
      return sex !== "M" && sex !== "MALE" && sex !== "F" && sex !== "FEMALE";
    };

    const filteredNodes = graphNodes.filter((n) => n.id === petId || matchesSex(n.sex));
    const filteredIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphLinks.filter(
      (l) => filteredIds.has(l.source as string) && filteredIds.has(l.target as string),
    );

    return { filteredGraphNodes: filteredNodes, filteredGraphLinks: filteredLinks };
  }, [graphNodes, graphLinks, sexFilter, petId]);

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
  }, [visibleNodes]);

  // COI 경로 엣지용 노드 ID 집합
  const visibleNodeIdSet = useMemo(
    () => new Set(visibleNodes.map((n) => n.petId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeKey],
  );

  return {
    visibleNodes,
    visibleEdges,
    generationMap,
    thumbnailMap,
    nodeKey,
    graphNodes,
    graphLinks,
    filteredGraphNodes,
    filteredGraphLinks,
    visibleMorphs,
    visibleNodeIdSet,
    pairPartnerIds,
  };
}
