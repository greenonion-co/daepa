"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import type { GraphNode, GraphLink } from "../lib/types";
import {
  nodeRadius,
  screenToSvg,
  computeNodeColor,
  computeEdgeColor,
  computeEdgeWidth,
  computeEdgeHidden,
  computeArrowMarkerId,
  computeNodeOpacity,
  computeLabelOpacity,
  type StyleContext,
} from "../lib/force-graph-utils";
import { MIN_RADIUS, ARROW_MARKER_DEFS } from "../lib/force-graph-constants";
import { useForceSimulation } from "../hooks/useForceSimulation";
import { useForceInteraction } from "../hooks/useForceInteraction";
import { GraphEdge } from "./GraphEdge";
import { GraphNodeElement } from "./GraphNodeElement";

export type { GraphNode, GraphLink };

interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  className?: string;
  selectedNodeIds?: string[];
  highlightSelected?: boolean;
  onNodeClick?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onNodeContextMenu?: (nodeId: string, position: { x: number; y: number }) => void;
  onCanvasContextMenu?: (
    position: { x: number; y: number },
    simPosition?: { x: number; y: number },
  ) => void;
  onCanvasClick?: (
    position: { x: number; y: number },
    simPosition?: { x: number; y: number },
  ) => void;
  focusNodeId?: string | null;
  initialNodePositions?: Record<string, { x: number; y: number }>;
  /** 패널 hover 시 함께 하이라이트할 자식 노드 ID 목록 */
  highlightedChildIds?: string[];
  /** 위치 재배치 함수를 부모에게 전달 */
  onReshuffleReady?: (reshuffle: () => void) => void;
}

// --- Component ---

export default function ForceGraph({
  nodes,
  links,
  className,
  selectedNodeIds,
  highlightSelected,
  onNodeClick,
  onNodeDoubleClick,
  onNodeHover,
  onNodeContextMenu,
  onCanvasContextMenu,
  onCanvasClick,
  focusNodeId,
  initialNodePositions,
  highlightedChildIds,
  onReshuffleReady,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const maxDegree = useMemo(() => Math.max(...nodes.map((n) => n.degree), 1), [nodes]);

  // Force simulation (rAF 배칭)
  const { simNodesRef, simLinksRef, simulationRef, tickId, SIM_DRAG_ALPHA_TARGET, reshufflePositions } = useForceSimulation({
    nodes, links, maxDegree, initialNodePositions,
  });

  // 부모에게 reshuffle 함수 전달
  useEffect(() => {
    onReshuffleReady?.(reshufflePositions);
  }, [onReshuffleReady, reshufflePositions]);

  // 인터랙션 (줌/팬, 포커스, 드래그, 클릭, hover)
  const {
    isMobile,
    hoveredNodeId,
    highlightFocusedId,
    connectedMap,
    handleNodePointerDown,
    handleNodeClick,
    handleNodeMouseEnter,
    handleNodeMouseLeave,
    clearMobileHover,
  } = useForceInteraction({
    svgRef, gRef, simNodesRef, simulationRef, SIM_DRAG_ALPHA_TARGET,
    nodes, links, focusNodeId, onNodeClick, onNodeDoubleClick, onNodeHover,
  });

  const selectedSet = useMemo(() => new Set(selectedNodeIds ?? []), [selectedNodeIds]);

  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(el.classList.contains("dark"));
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const childSet = useMemo(() => new Set(highlightedChildIds ?? []), [highlightedChildIds]);

  // 같은 부모를 가진 형제(클러치 메이트) 맵: parentKey → Set<nodeId>
  const siblingMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const node of nodes) {
      if (!node.fatherId && !node.motherId) continue;
      const key = `${node.fatherId ?? ""}-${node.motherId ?? ""}`;
      let set = map.get(key);
      if (!set) {
        set = new Set();
        map.set(key, set);
      }
      set.add(node.id);
    }
    return map;
  }, [nodes]);

  // hover된 노드의 형제 Set (자기 자신 제외)
  const siblingSet = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const hovered = simNodesRef.current.find((n) => n.id === hoveredNodeId);
    if (!hovered || (!hovered.fatherId && !hovered.motherId)) return new Set<string>();
    const key = `${hovered.fatherId ?? ""}-${hovered.motherId ?? ""}`;
    const siblings = siblingMap.get(key);
    if (!siblings) return new Set<string>();
    const result = new Set(siblings);
    result.delete(hoveredNodeId);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredNodeId, siblingMap]);

  // 노드별 반지름 캐시 (degree/isPairOfCenter는 props에서 결정되므로 nodes 변경 시만 재계산)
  const nodeRadiusMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const node of nodes) {
      map.set(node.id, nodeRadius(node.degree, maxDegree, node.isPairOfCenter));
    }
    return map;
  }, [nodes, maxDegree]);

  // 스타일 컨텍스트 (순수함수에 전달)
  const styleCtx = useMemo<StyleContext>(
    () => ({
      hoveredNodeId,
      isDark,
      highlightSelected: !!highlightSelected,
      selectedSet,
      childSet,
      siblingSet,
      connectedMap: connectedMap.current,
      simNodes: simNodesRef.current,
      maxDegree,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hoveredNodeId, isDark, highlightSelected, selectedSet, childSet, siblingSet, maxDegree, tickId],
  );

  return (
    <svg
      ref={svgRef}
      className={className}
      style={{ width: "100%", height: "100%", cursor: "grab", touchAction: "none" }}
      onContextMenu={(e) => {
        e.preventDefault();
        const simPos = gRef.current ? screenToSvg(gRef.current, e.clientX, e.clientY) : undefined;
        onCanvasContextMenu?.({ x: e.clientX, y: e.clientY }, simPos ?? undefined);
      }}
      onClick={(e) => {
        if ((e.target as Element)?.closest?.("[data-node]")) return;
        // 모바일: hover 활성 상태면 해제만 하고 캔버스 클릭은 무시
        if (isMobile && hoveredNodeId) {
          clearMobileHover();
          return;
        }
        clearMobileHover();
        const simPos = gRef.current ? screenToSvg(gRef.current, e.clientX, e.clientY) : undefined;
        onCanvasClick?.({ x: e.clientX, y: e.clientY }, simPos ?? undefined);
      }}
    >
      <g ref={gRef}>
        {/* ClipPath + 화살표 마커 정의 */}
        <defs>
          {simNodesRef.current.map((node) => {
            if (!node.imageUrl) return null;
            const r = nodeRadiusMap.get(node.id) ?? MIN_RADIUS;
            return (
              <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`}>
                <circle r={r} />
              </clipPath>
            );
          })}
          {/* offspring 엣지 화살표 — 색상별 별도 마커, hover/coi/selected는 크게 */}
          {ARROW_MARKER_DEFS.map(([id, color, mw, mh]) => (
            <marker
              key={id}
              id={id}
              viewBox="0 0 10 6"
              refX="10"
              refY="3"
              markerUnits="userSpaceOnUse"
              markerWidth={mw}
              markerHeight={mh}
              orient="auto"
            >
              <path d="M 0 0 L 10 3 L 0 6 Z" fill={color} />
            </marker>
          ))}
          {/* 포커스 글로우 필터 */}
          <filter id="node-focus-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>
        </defs>
        <style>{`
          @keyframes nodeGlowPulse {
            0%   { opacity: 0; }
            15%  { opacity: 0.9; }
            50%  { opacity: 0.55; }
            85%  { opacity: 0.9; }
            100% { opacity: 0; }
          }
        `}</style>

        {/* Edges */}
        {simLinksRef.current.map((link) => {
          const s = link.source as GraphNode;
          const t = link.target as GraphNode;
          if (s.x == null || t.x == null || s.y == null || t.y == null) return null;
          const edgeColor = computeEdgeColor(link, styleCtx);
          return (
            <GraphEdge
              key={`${s.id}-${t.id}`}
              link={link}
              sx={s.x}
              sy={s.y}
              tx={t.x}
              ty={t.y}
              nodeRadiusMap={nodeRadiusMap}
              color={edgeColor}
              width={computeEdgeWidth(link, styleCtx)}
              arrowMarkerId={computeArrowMarkerId(edgeColor)}
              hidden={computeEdgeHidden(link, !!highlightSelected, selectedSet, childSet)}
            />
          );
        })}

        {/* Nodes */}
        {simNodesRef.current.map((node) => {
          if (node.x == null || node.y == null) return null;
          return (
          <GraphNodeElement
            key={node.id}
            node={node}
            x={node.x}
            y={node.y}
            radius={nodeRadiusMap.get(node.id) ?? MIN_RADIUS}
            color={computeNodeColor(node, styleCtx)}
            opacity={computeNodeOpacity(node, styleCtx)}
            labelOpacity={computeLabelOpacity(node, styleCtx)}
            isSelected={selectedSet.has(node.id)}
            isDark={isDark}
            isFocused={highlightFocusedId === node.id}
            onMouseEnter={handleNodeMouseEnter}
            onMouseLeave={handleNodeMouseLeave}
            onPointerDown={handleNodePointerDown}
            onClick={handleNodeClick}
            onContextMenu={onNodeContextMenu}
          />
          );
        })}
      </g>
    </svg>
  );
}
