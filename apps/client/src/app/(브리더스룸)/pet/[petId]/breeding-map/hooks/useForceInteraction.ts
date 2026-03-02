import { useEffect, useRef, useState, useCallback, type RefObject } from "react";
import type { forceSimulation } from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior } from "d3-zoom";
import type { GraphNode, GraphLink } from "../lib/types";
import { getLinkSourceId, getLinkTargetId, screenToSvg } from "../lib/force-graph-utils";
import {
  DBLCLICK_DELAY,
  FOCUS_MIN_ZOOM,
  FOCUS_TRANSITION_MS,
  FOCUS_HIGHLIGHT_MS,
  FOCUS_RETRY_TIMEOUT,
  FOCUS_RETRY_INTERVAL,
} from "../lib/force-graph-constants";
import { useIsMobile } from "@/hooks/useMobile";

interface UseForceInteractionParams {
  svgRef: RefObject<SVGSVGElement | null>;
  gRef: RefObject<SVGGElement | null>;
  simNodesRef: RefObject<GraphNode[]>;
  simulationRef: RefObject<ReturnType<typeof forceSimulation<GraphNode>> | null>;
  SIM_DRAG_ALPHA_TARGET: number;
  nodes: GraphNode[];
  links: GraphLink[];
  focusNodeId?: string | null;
  onNodeClick?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
}

export function useForceInteraction({
  svgRef,
  gRef,
  simNodesRef,
  simulationRef,
  SIM_DRAG_ALPHA_TARGET,
  nodes,
  links,
  focusNodeId,
  onNodeClick,
  onNodeDoubleClick,
  onNodeHover,
}: UseForceInteractionParams) {
  const isMobile = useIsMobile();
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const dragMovedRef = useRef(false);
  const pendingClickRef = useRef<{
    timer: ReturnType<typeof setTimeout>;
    nodeId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [highlightFocusedId, setHighlightFocusedId] = useState<string | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 연결 정보 (hover 하이라이트용)
  const connectedMap = useRef(new Map<string, Set<string>>());
  useEffect(() => {
    const map = new Map<string, Set<string>>();
    for (const node of nodes) {
      map.set(node.id, new Set());
    }
    for (const link of links) {
      const s = getLinkSourceId(link);
      const t = getLinkTargetId(link);
      map.get(s)?.add(t);
      map.get(t)?.add(s);
    }
    connectedMap.current = map;
  }, [nodes, links]);

  // Zoom & Pan 초기화
  useEffect(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .filter((event) => !(event.target as Element)?.closest?.("[data-node]"))
      .on("zoom", (event) => {
        select(g).attr("transform", event.transform);
      });

    select(svg).call(zoomBehavior);
    zoomRef.current = zoomBehavior;

    const { width, height } = svg.getBoundingClientRect();
    select(svg).call(zoomBehavior.transform, zoomIdentity.translate(width / 2, height / 2));

    return () => {
      select(svg).on(".zoom", null);
    };
  }, []);

  // focusNodeId → 해당 노드로 줌인 + pan + 2초 하이라이트
  useEffect(() => {
    if (!focusNodeId) return;
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;

    const doFocus = () => {
      const node = simNodesRef.current.find((n) => n.id === focusNodeId);
      if (!node || node.x == null || node.y == null) return false;

      const { width, height } = svg.getBoundingClientRect();
      const targetK = Math.max(zoomTransform(svg).k, FOCUS_MIN_ZOOM);
      select(svg)
        .transition()
        .duration(FOCUS_TRANSITION_MS)
        .call(
          zoomRef.current!.transform,
          zoomIdentity
            .translate(width / 2 - node.x * targetK, height / 2 - node.y * targetK)
            .scale(targetK),
        );
      setHighlightFocusedId(focusNodeId);
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = setTimeout(() => setHighlightFocusedId(null), FOCUS_HIGHLIGHT_MS);
      return true;
    };

    if (doFocus()) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (doFocus() || Date.now() - startTime > FOCUS_RETRY_TIMEOUT) clearInterval(interval);
    }, FOCUS_RETRY_INTERVAL);
    return () => clearInterval(interval);
  }, [focusNodeId]);

  // unmount 시 timeout 정리
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      if (pendingClickRef.current) {
        clearTimeout(pendingClickRef.current.timer);
        pendingClickRef.current = null;
      }
    };
  }, []);

  // 노드 드래그 (pointer events: 마우스+터치 통합)
  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const g = gRef.current;
      if (!g) return;

      const node = simNodesRef.current.find((n) => n.id === nodeId);
      if (!node) return;

      node.fx = node.x;
      node.fy = node.y;
      dragMovedRef.current = false;
      let dragStarted = false;

      const handlePointerMove = (ev: PointerEvent) => {
        dragMovedRef.current = true;
        if (!dragStarted) {
          dragStarted = true;
          simulationRef.current?.alphaTarget(SIM_DRAG_ALPHA_TARGET).restart();
        }
        const pos = screenToSvg(g, ev.clientX, ev.clientY);
        if (pos) {
          node.fx = pos.x;
          node.fy = pos.y;
        }
      };

      const handlePointerUp = () => {
        node.fx = node.x;
        node.fy = node.y;
        simulationRef.current?.alphaTarget(0);

        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [SIM_DRAG_ALPHA_TARGET],
  );

  // 노드 클릭 (드래그와 구분, 더블클릭 감지)
  const handleNodeClick = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      if (dragMovedRef.current) return;

      // 모바일: 탭으로 hover 하이라이트 고정
      if (isMobile) {
        setHoveredNodeId(nodeId);
        onNodeHover?.(nodeId);
      }

      if (pendingClickRef.current?.nodeId === nodeId) {
        clearTimeout(pendingClickRef.current.timer);
        pendingClickRef.current = null;
        onNodeDoubleClick?.(nodeId);
        return;
      }

      if (pendingClickRef.current) {
        const prev = pendingClickRef.current;
        clearTimeout(prev.timer);
        pendingClickRef.current = null;
        onNodeClick?.(prev.nodeId, prev.position);
      }

      const timer = setTimeout(() => {
        if (!pendingClickRef.current) return;
        pendingClickRef.current = null;
        onNodeClick?.(nodeId, position);
      }, DBLCLICK_DELAY);

      pendingClickRef.current = { timer, nodeId, position };
    },
    [onNodeClick, onNodeDoubleClick, isMobile, onNodeHover],
  );

  // hover 핸들러 (데스크톱 전용 — 모바일은 탭으로 대체)
  const handleNodeMouseEnter = useCallback(
    (nodeId: string) => {
      if (isMobile) return;
      setHoveredNodeId(nodeId);
      onNodeHover?.(nodeId);
    },
    [onNodeHover, isMobile],
  );

  const handleNodeMouseLeave = useCallback(() => {
    if (isMobile) return;
    setHoveredNodeId(null);
    onNodeHover?.(null);
  }, [onNodeHover, isMobile]);

  // 모바일: 빈 영역 탭 시 hover 해제
  const clearMobileHover = useCallback(() => {
    if (!isMobile) return;
    setHoveredNodeId(null);
    onNodeHover?.(null);
  }, [isMobile, onNodeHover]);

  return {
    isMobile,
    hoveredNodeId,
    highlightFocusedId,
    connectedMap,
    handleNodePointerDown,
    handleNodeClick,
    handleNodeMouseEnter,
    handleNodeMouseLeave,
    clearMobileHover,
  };
}
