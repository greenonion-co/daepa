"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior } from "d3-zoom";
import { getMorphOrTraitColor } from "@/app/(브리더스룸)/hatching/components/Charts/morphColors";

// --- Types ---

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  degree: number;
  imageUrl?: string;
  sex?: string;
  isPairOfCenter?: boolean;
  generation?: number;
  morphs?: string[];
  isPrivate?: boolean;
  fatherId?: string;
  motherId?: string;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  isPair?: boolean;
}

interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  className?: string;
  selectedNodeIds?: string[];
  highlightSelected?: boolean;
  highlightedEdges?: { source: string; target: string }[];
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
}

// --- Constants ---

const MIN_RADIUS = 20;
const MAX_RADIUS = 40;
const BASE_FONT_SIZE = 10;

const COLOR_DEFAULT_NODE = "#5a6a7a";
const COLOR_DEFAULT_EDGE = "#d1d5db";
const COLOR_HOVER_NODE = "#22d3ee";
const COLOR_HOVER_CENTER = "#fbbf24";
const COLOR_HOVER_EDGE = "#22d3ee";
const COLOR_FADED = "#e5e7eb";
const COLOR_FADED_DARK = "#374151";
const COLOR_SELECTED_RING = "#3b82f6";
const DBLCLICK_DELAY = 250;

const COLOR_COI_PATH = "#10b981"; // emerald-500
const COLOR_COI_PATH_WIDTH = 3;

const COLOR_PAIR_EDGE = "#c084fc"; // purple-400 (같은 세대 · pair 엣지)
const COLOR_PAIR_EDGE_DARK = "#a78bfa"; // violet-400
const COLOR_HOVER_PAIR_EDGE = "#e879f9"; // fuchsia-400 (hover 시 pair 엣지)
const COLOR_PARENT_EDGE = "#f97316"; // orange-500 (hover 시 부모 엣지)
const COLOR_CHILD_HIGHLIGHT = "#22d3ee"; // cyan-400 (패널 hover 시 자식 하이라이트)

const PAIR_RADIUS_BOOST = 8;
const PAIR_ALIGN_STRENGTH = 0.6; // pair 쌍 Y축 정렬 강도
const GENERATION_GAP = 200; // 세대 간 Y축 간격 (px)
const GENERATION_Y_STRENGTH = 0.3; // 세대 Y축 정렬 강도

/** 모프 색상이 배경과 대비가 부족할 때 보정 */
function adjustMorphColorForTheme(hex: string, isDark: boolean): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (isDark && luminance < 0.2) {
    const f = 1.8;
    return `rgb(${Math.min(255, Math.round(r * f + 40))},${Math.min(255, Math.round(g * f + 40))},${Math.min(255, Math.round(b * f + 40))})`;
  }
  if (!isDark && luminance > 0.85) {
    const f = 0.6;
    return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
  }
  return hex;
}

function nodeRadius(degree: number, maxDegree: number, isPairOfCenter?: boolean): number {
  if (maxDegree <= 1) return MIN_RADIUS + 4 + (isPairOfCenter ? PAIR_RADIUS_BOOST : 0);
  const t = degree / maxDegree;
  const base = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
  return base + (isPairOfCenter ? PAIR_RADIUS_BOOST : 0);
}

/** screen 좌표 → SVG <g> 내부 좌표 변환 */
function screenToSvg(
  gEl: SVGGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const ctm = gEl.getScreenCTM();
  if (!ctm) return null;
  const svg = gEl.ownerSVGElement!;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const svgPt = pt.matrixTransform(ctm.inverse());
  return { x: svgPt.x, y: svgPt.y };
}

// --- Component ---

export default function ForceGraph({
  nodes,
  links,
  className,
  selectedNodeIds,
  highlightSelected,
  highlightedEdges,
  onNodeClick,
  onNodeDoubleClick,
  onNodeHover,
  onNodeContextMenu,
  onCanvasContextMenu,
  onCanvasClick,
  focusNodeId,
  initialNodePositions,
  highlightedChildIds,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [simNodes, setSimNodes] = useState<GraphNode[]>([]);
  const [simLinks, setSimLinks] = useState<GraphLink[]>([]);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const simNodesRef = useRef<GraphNode[]>([]);
  const prevNodeCountRef = useRef(0);
  const dragMovedRef = useRef(false);
  const pendingClickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [highlightFocusedId, setHighlightFocusedId] = useState<string | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialNodePositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    initialNodePositionsRef.current = initialNodePositions ?? {};
  }, [initialNodePositions]);

  const selectedSet = new Set(selectedNodeIds ?? []);

  const isDark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  // COI 경로 엣지/노드 룩업
  const coiEdgeSet = useMemo(() => {
    const set = new Set<string>();
    for (const e of highlightedEdges ?? []) {
      set.add(`${e.source}-${e.target}`);
      set.add(`${e.target}-${e.source}`);
    }
    return set;
  }, [highlightedEdges]);

  const coiNodeSet = useMemo(() => {
    const set = new Set<string>();
    for (const e of highlightedEdges ?? []) {
      set.add(e.source);
      set.add(e.target);
    }
    return set;
  }, [highlightedEdges]);

  const childSet = useMemo(() => new Set(highlightedChildIds ?? []), [highlightedChildIds]);

  const maxDegree = Math.max(...nodes.map((n) => n.degree), 1);

  // 연결 정보 (hover 하이라이트용)
  const connectedMap = useRef(new Map<string, Set<string>>());
  useEffect(() => {
    const map = new Map<string, Set<string>>();
    for (const node of nodes) {
      map.set(node.id, new Set());
    }
    for (const link of links) {
      const s = typeof link.source === "string" ? link.source : link.source.id;
      const t = typeof link.target === "string" ? link.target : link.target.id;
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
      // 노드 위에서 시작된 이벤트는 zoom 대신 drag 처리
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
      const targetK = Math.max(zoomTransform(svg).k, 1.8);
      select(svg)
        .transition()
        .duration(700)
        .call(
          zoomRef.current!.transform,
          zoomIdentity
            .translate(width / 2 - node.x * targetK, height / 2 - node.y * targetK)
            .scale(targetK),
        );
      setHighlightFocusedId(focusNodeId);
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = setTimeout(() => setHighlightFocusedId(null), 2000);
      return true;
    };

    // 즉시 시도 — 좌표가 없으면 시뮬레이션 틱 후 재시도 (최대 2초)
    if (doFocus()) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (doFocus() || Date.now() - startTime > 2000) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [focusNodeId]);

  // unmount 시 timeout 정리
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    };
  }, []);

  // Force simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const prevPositions = new Map<
      string,
      { x: number; y: number; fx?: number | null; fy?: number | null }
    >();
    for (const n of simNodesRef.current) {
      if (n.x != null && n.y != null) {
        prevPositions.set(n.id, { x: n.x, y: n.y, fx: n.fx, fy: n.fy });
      }
    }

    // 링크에서 이웃 관계 미리 구성 (새 노드 초기 위치용)
    const neighborMap = new Map<string, string[]>();
    for (const link of links) {
      const s = typeof link.source === "string" ? link.source : (link.source as GraphNode).id;
      const t = typeof link.target === "string" ? link.target : (link.target as GraphNode).id;
      if (!neighborMap.has(s)) neighborMap.set(s, []);
      if (!neighborMap.has(t)) neighborMap.set(t, []);
      neighborMap.get(s)!.push(t);
      neighborMap.get(t)!.push(s);
    }

    // 기존 노드들의 bounding box — 고아 노드를 기존 트리 바로 옆에 배치
    const existingPositions = Array.from(prevPositions.values());
    const maxX = existingPositions.length > 0 ? Math.max(...existingPositions.map((p) => p.x)) : 0;
    const midY =
      existingPositions.length > 0
        ? existingPositions.reduce((s, p) => s + p.y, 0) / existingPositions.length
        : 0;

    const newNodes: GraphNode[] = nodes.map((n) => {
      const prev = prevPositions.get(n.id);
      if (prev) {
        return { ...n, x: prev.x, y: prev.y, fx: prev.fx ?? undefined, fy: prev.fy ?? undefined };
      }
      // 새 노드: 연결된 이웃 노드 위치 근처에서 시작
      for (const neighborId of neighborMap.get(n.id) ?? []) {
        const neighborPos = prevPositions.get(neighborId);
        if (neighborPos) {
          return {
            ...n,
            x: neighborPos.x + (Math.random() - 0.5) * 60,
            y: neighborPos.y + (Math.random() - 0.5) * 60,
          };
        }
      }
      // 초기 위치가 지정된 노드 (빠른 등록 등)
      const initialPos = initialNodePositionsRef.current[n.id];
      if (initialPos) {
        delete initialNodePositionsRef.current[n.id];
        return { ...n, x: initialPos.x, y: initialPos.y };
      }
      // 이웃 없는 고아 노드(완전 분리 서브그래프): 기존 트리 오른쪽 끝 바로 옆에서 시작
      return {
        ...n,
        x: maxX + 150 + (Math.random() - 0.5) * 80,
        y: midY + (Math.random() - 0.5) * 150,
      };
    });

    const newLinks: GraphLink[] = links.map((l) => ({ ...l }));

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    simNodesRef.current = newNodes;

    // pair 쌍을 같은 Y축에 정렬하는 커스텀 force
    const pairAlignForce = (alpha: number) => {
      for (const link of newLinks) {
        if (!link.isPair) continue;
        const s = link.source as GraphNode;
        const t = link.target as GraphNode;
        if (s.y == null || t.y == null) continue;
        const avgY = (s.y + t.y) / 2;
        const k = PAIR_ALIGN_STRENGTH * alpha;
        if (s.vy != null) s.vy += (avgY - s.y) * k;
        if (t.vy != null) t.vy += (avgY - t.y) * k;
      }
    };

    const sim = forceSimulation<GraphNode>(newNodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(newLinks)
          .id((d) => d.id)
          .distance(180),
      )
      .force("charge", forceManyBody().strength(-600))
      .force("center", forceCenter(0, 0))
      .force("x", forceX(0).strength(0.06))
      .force(
        "y",
        forceY<GraphNode>((d) =>
          d.generation != null ? d.generation * GENERATION_GAP : 0,
        ).strength((d) => (d.generation != null ? GENERATION_Y_STRENGTH : 0.06)),
      )
      .force(
        "collide",
        forceCollide<GraphNode>((d) => nodeRadius(d.degree, maxDegree, d.isPairOfCenter) + 20),
      )
      .force("pairAlign", pairAlignForce)
      .alphaDecay(0.02)
      .on("tick", () => {
        setSimNodes([...newNodes]);
        setSimLinks([...newLinks]);
      });

    simulationRef.current = sim;

    if (nodes.length !== prevNodeCountRef.current) {
      // 확장(노드 추가)이면 낮은 alpha로 기존 노드 흔들림 최소화
      const isExpansion = nodes.length > prevNodeCountRef.current;
      prevNodeCountRef.current = nodes.length;
      sim.alpha(isExpansion ? 0.3 : 0.8).restart();
    }

    return () => {
      sim.stop();
    };
  }, [nodes, links, maxDegree]);

  // 노드 드래그
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return; // 우클릭 등 non-primary 버튼은 드래그 무시
    e.preventDefault();
    e.stopPropagation();

    const g = gRef.current;
    if (!g) return;

    const node = simNodesRef.current.find((n) => n.id === nodeId);
    if (!node) return;

    // 현재 위치에 고정 (드래그 전까지는 시뮬레이션 재가열 안 함)
    node.fx = node.x;
    node.fy = node.y;
    dragMovedRef.current = false;
    let dragStarted = false;

    const handleMouseMove = (ev: MouseEvent) => {
      dragMovedRef.current = true;
      // 첫 이동 시점에만 시뮬레이션 재가열 (클릭만이면 불필요)
      if (!dragStarted) {
        dragStarted = true;
        simulationRef.current?.alphaTarget(0.3).restart();
      }
      const pos = screenToSvg(g, ev.clientX, ev.clientY);
      if (pos) {
        node.fx = pos.x;
        node.fy = pos.y;
      }
    };

    const handleMouseUp = () => {
      // 드래그·클릭 모두 현재 위치에 고정 유지
      node.fx = node.x;
      node.fy = node.y;
      simulationRef.current?.alphaTarget(0);

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  // 노드 클릭 (드래그와 구분, 더블클릭 감지)
  const handleNodeClick = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      if (dragMovedRef.current) return;

      // 더블클릭 감지: 이미 대기 중인 클릭이 있으면 더블클릭
      if (pendingClickRef.current) {
        clearTimeout(pendingClickRef.current);
        pendingClickRef.current = null;
        onNodeDoubleClick?.(nodeId);
        return;
      }

      // 싱글클릭: 딜레이 후 실행
      pendingClickRef.current = setTimeout(() => {
        pendingClickRef.current = null;
        onNodeClick?.(nodeId, position);
      }, DBLCLICK_DELAY);
    },
    [onNodeClick, onNodeDoubleClick],
  );

  // Hover 로직
  const isConnected = useCallback(
    (nodeId: string) => {
      if (!hoveredNodeId) return false;
      if (nodeId === hoveredNodeId) return true;
      return connectedMap.current.get(hoveredNodeId)?.has(nodeId) ?? false;
    },
    [hoveredNodeId],
  );

  const isEdgeConnected = useCallback(
    (link: GraphLink) => {
      if (!hoveredNodeId) return false;
      const s = typeof link.source === "string" ? link.source : link.source.id;
      const t = typeof link.target === "string" ? link.target : link.target.id;
      return s === hoveredNodeId || t === hoveredNodeId;
    },
    [hoveredNodeId],
  );

  /** hover된 노드의 부모를 가리키는 엣지인지 판별 (offspring source→target 중 target이 hovered, source가 부/모) */
  const isParentOfHovered = useCallback(
    (link: GraphLink) => {
      if (!hoveredNodeId) return false;
      const hoveredNode = simNodesRef.current.find((n) => n.id === hoveredNodeId);
      if (!hoveredNode) return false;
      const s = typeof link.source === "string" ? link.source : link.source.id;
      const t = typeof link.target === "string" ? link.target : link.target.id;
      // offspring 엣지: source(부모) → target(자식). target === hoveredNodeId이고 source가 fatherId/motherId
      if (t === hoveredNodeId && (s === hoveredNode.fatherId || s === hoveredNode.motherId))
        return true;
      // 반대 방향도 체크 (엣지 방향이 반전될 수 있으므로)
      if (s === hoveredNodeId && (t === hoveredNode.fatherId || t === hoveredNode.motherId))
        return true;
      return false;
    },
    [hoveredNodeId],
  );

  const isCoiPathEdge = useCallback(
    (link: GraphLink) => {
      if (coiEdgeSet.size === 0) return false;
      const s = typeof link.source === "string" ? link.source : link.source.id;
      const t = typeof link.target === "string" ? link.target : link.target.id;
      return coiEdgeSet.has(`${s}-${t}`);
    },
    [coiEdgeSet],
  );

  /** 모프 색상 또는 기본 색상 반환 */
  const getMorphColor = useCallback(
    (node: GraphNode) => {
      const firstMorph = node.morphs?.[0];
      if (firstMorph) {
        return adjustMorphColorForTheme(getMorphOrTraitColor(firstMorph), isDark);
      }
      return isDark ? "#94a3b8" : COLOR_DEFAULT_NODE;
    },
    [isDark],
  );

  const getNodeColor = useCallback(
    (node: GraphNode) => {
      if (highlightSelected && selectedSet.size > 0) {
        if (selectedSet.has(node.id)) return isDark ? COLOR_PAIR_EDGE_DARK : COLOR_PAIR_EDGE;
        if (childSet.has(node.id)) return COLOR_CHILD_HIGHLIGHT;
        if (coiNodeSet.has(node.id)) return getMorphColor(node);
        return isDark ? COLOR_FADED_DARK : COLOR_FADED;
      }
      if (!hoveredNodeId) return getMorphColor(node);
      if (node.id === hoveredNodeId) return COLOR_HOVER_CENTER;
      if (isConnected(node.id)) {
        // 부모 노드 강조
        const hoveredNode = simNodesRef.current.find((n) => n.id === hoveredNodeId);
        if (hoveredNode && (node.id === hoveredNode.fatherId || node.id === hoveredNode.motherId)) {
          return COLOR_PARENT_EDGE; // orange — 부모
        }
        // pair(같은 세대) vs offspring(다른 세대) 구분
        const hoveredGen = hoveredNode?.generation;
        if (hoveredGen != null && node.generation != null && hoveredGen === node.generation) {
          return COLOR_HOVER_PAIR_EDGE; // fuchsia — pair 이웃
        }
        return COLOR_HOVER_NODE; // cyan — offspring 이웃
      }
      return isDark ? COLOR_FADED_DARK : COLOR_FADED;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      hoveredNodeId,
      isDark,
      isConnected,
      highlightSelected,
      selectedNodeIds,
      getMorphColor,
      coiNodeSet,
      childSet,
    ],
  );

  const isEdgeBetweenSelected = useCallback(
    (link: GraphLink) => {
      const s = typeof link.source === "string" ? link.source : link.source.id;
      const t = typeof link.target === "string" ? link.target : link.target.id;
      return selectedSet.has(s) && selectedSet.has(t);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedNodeIds],
  );

  /** 선택된 부모 → 자식(highlightedChildIds)을 잇는 엣지 여부 */
  const isEdgeToChild = useCallback(
    (link: GraphLink) => {
      if (childSet.size === 0) return false;
      const s = typeof link.source === "string" ? link.source : link.source.id;
      const t = typeof link.target === "string" ? link.target : link.target.id;
      // 한쪽이 selected(부모), 다른 쪽이 child
      return (selectedSet.has(s) && childSet.has(t)) || (selectedSet.has(t) && childSet.has(s));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedNodeIds, childSet],
  );

  /** 같은 세대 노드를 잇는 pair 엣지 여부 */
  const isPairEdge = useCallback((link: GraphLink) => {
    const s = link.source as GraphNode;
    const t = link.target as GraphNode;
    return s.generation != null && t.generation != null && s.generation === t.generation;
  }, []);

  const getDefaultEdgeColor = useCallback(
    (link: GraphLink) => {
      if (isPairEdge(link)) return isDark ? COLOR_PAIR_EDGE_DARK : COLOR_PAIR_EDGE;
      return isDark ? "#4b5563" : COLOR_DEFAULT_EDGE;
    },
    [isPairEdge, isDark],
  );

  const getEdgeColor = useCallback(
    (link: GraphLink) => {
      if (highlightSelected && selectedSet.size > 0) {
        if (isEdgeBetweenSelected(link)) return isDark ? COLOR_PAIR_EDGE_DARK : COLOR_PAIR_EDGE;
        if (isEdgeToChild(link)) return COLOR_CHILD_HIGHLIGHT;
        if (isCoiPathEdge(link)) return COLOR_COI_PATH;
        return isDark ? "#1f2937" : "#f3f4f6";
      }
      if (!hoveredNodeId) return getDefaultEdgeColor(link);
      if (isParentOfHovered(link)) return COLOR_PARENT_EDGE;
      if (isEdgeConnected(link)) return isPairEdge(link) ? COLOR_HOVER_PAIR_EDGE : COLOR_HOVER_EDGE;
      return isDark ? "#1f2937" : "#f3f4f6";
    },
    [
      hoveredNodeId,
      isDark,
      isEdgeConnected,
      isParentOfHovered,
      highlightSelected,
      isEdgeBetweenSelected,
      isEdgeToChild,
      selectedSet.size,
      isCoiPathEdge,
      getDefaultEdgeColor,
      isPairEdge,
    ],
  );

  const getArrowMarkerId = useCallback((color: string) => {
    if (color === COLOR_PARENT_EDGE) return "arrowhead-parent";
    if (color === COLOR_CHILD_HIGHLIGHT) return "arrowhead-child-hl";
    if (color === COLOR_HOVER_EDGE) return "arrowhead-hover";
    if (color === COLOR_COI_PATH) return "arrowhead-coi";
    if (color === COLOR_SELECTED_RING) return "arrowhead-selected";
    if (color === "#f3f4f6") return "arrowhead-faded-light";
    if (color === "#1f2937") return "arrowhead-faded-dark";
    if (color === "#4b5563") return "arrowhead-dark";
    return "arrowhead";
  }, []);

  const getEdgeWidth = useCallback(
    (link: GraphLink) => {
      if (highlightSelected && selectedSet.size > 0) {
        if (isEdgeBetweenSelected(link)) return 2.5;
        if (isEdgeToChild(link)) return 2.5;
        if (isCoiPathEdge(link)) return COLOR_COI_PATH_WIDTH;
        return 0.5;
      }
      if (!hoveredNodeId) return 1;
      if (isParentOfHovered(link)) return 3;
      if (isEdgeConnected(link)) return 2.5;
      return 0.5;
    },
    [
      hoveredNodeId,
      isEdgeConnected,
      isParentOfHovered,
      highlightSelected,
      isEdgeBetweenSelected,
      isEdgeToChild,
      selectedSet.size,
      isCoiPathEdge,
    ],
  );

  const getLabelOpacity = useCallback(
    (node: GraphNode) => {
      if (highlightSelected && selectedSet.size > 0) {
        return selectedSet.has(node.id) || childSet.has(node.id) || coiNodeSet.has(node.id)
          ? 1
          : 0.1;
      }
      if (!hoveredNodeId) {
        return node.degree >= maxDegree * 0.3 ? 0.7 : 0.4;
      }
      if (isConnected(node.id)) return 1;
      return 0.1;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      hoveredNodeId,
      maxDegree,
      isConnected,
      highlightSelected,
      selectedNodeIds,
      coiNodeSet,
      childSet,
    ],
  );

  const getNodeOpacity = useCallback(
    (node: GraphNode) => {
      if (highlightSelected && selectedSet.size > 0) {
        return selectedSet.has(node.id) || childSet.has(node.id) || coiNodeSet.has(node.id)
          ? 1
          : 0.15;
      }
      if (!hoveredNodeId) return 1;
      if (isConnected(node.id)) return 1;
      return 0.2;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hoveredNodeId, isConnected, highlightSelected, selectedNodeIds, coiNodeSet, childSet],
  );

  return (
    <svg
      ref={svgRef}
      className={className}
      style={{ width: "100%", height: "100%", cursor: "grab" }}
      onContextMenu={(e) => {
        e.preventDefault();
        const simPos = gRef.current ? screenToSvg(gRef.current, e.clientX, e.clientY) : undefined;
        onCanvasContextMenu?.({ x: e.clientX, y: e.clientY }, simPos ?? undefined);
      }}
      onClick={(e) => {
        if ((e.target as Element)?.closest?.("[data-node]")) return;
        const simPos = gRef.current ? screenToSvg(gRef.current, e.clientX, e.clientY) : undefined;
        onCanvasClick?.({ x: e.clientX, y: e.clientY }, simPos ?? undefined);
      }}
    >
      <g ref={gRef}>
        {/* ClipPath + 화살표 마커 정의 */}
        <defs>
          {simNodes.map((node) => {
            const r = nodeRadius(node.degree, maxDegree, node.isPairOfCenter);
            return (
              <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`}>
                <circle r={r} />
              </clipPath>
            );
          })}
          {/* offspring 엣지 화살표 — 색상별 별도 마커, hover/coi/selected는 크게 */}
          {(
            [
              ["arrowhead", COLOR_DEFAULT_EDGE, 8, 6],
              ["arrowhead-dark", "#4b5563", 8, 6],
              ["arrowhead-hover", COLOR_HOVER_EDGE, 14, 10],
              ["arrowhead-coi", COLOR_COI_PATH, 16, 11],
              ["arrowhead-parent", COLOR_PARENT_EDGE, 14, 10],
              ["arrowhead-child-hl", COLOR_CHILD_HIGHLIGHT, 14, 10],
              ["arrowhead-selected", COLOR_SELECTED_RING, 14, 10],
              ["arrowhead-faded-light", "#f3f4f6", 6, 4],
              ["arrowhead-faded-dark", "#1f2937", 6, 4],
            ] as [string, string, number, number][]
          ).map(([id, color, mw, mh]) => (
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
        {simLinks.map((link, i) => {
          const s = link.source as GraphNode;
          const t = link.target as GraphNode;
          if (s.x == null || t.x == null || s.y == null || t.y == null) return null;

          // 페어 하이라이트 모드: 개별 부모→자식 엣지는 숨김 (merged 엣지로 대체)
          if (
            highlightSelected &&
            selectedSet.size === 2 &&
            childSet.size > 0 &&
            isEdgeToChild(link)
          ) {
            return null;
          }

          const isOffspring = !(link as GraphLink).isPair;
          let x1 = s.x,
            y1 = s.y,
            x2 = t.x,
            y2 = t.y;

          if (isOffspring) {
            const dx = t.x - s.x;
            const dy = t.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              const srcR = nodeRadius(s.degree, maxDegree, s.isPairOfCenter);
              const tgtR = nodeRadius(t.degree, maxDegree, t.isPairOfCenter);
              x1 = s.x + (dx / dist) * srcR;
              y1 = s.y + (dy / dist) * srcR;
              // 화살표 팁이 노드 테두리에 바로 붙도록 1px 여유
              x2 = t.x - (dx / dist) * (tgtR + 0);
              y2 = t.y - (dy / dist) * (tgtR + 0);
            }
          }

          const edgeColor = getEdgeColor(link);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={edgeColor}
              strokeWidth={getEdgeWidth(link)}
              markerEnd={isOffspring ? `url(#${getArrowMarkerId(edgeColor)})` : undefined}
              style={{ transition: "stroke-width 0.2s" }}
            />
          );
        })}

        {/* Merged parent→child edges: 페어 중간점에서 각 자식으로 단일 화살표 */}
        {/* {highlightSelected &&
          selectedSet.size === 2 &&
          childSet.size > 0 &&
          (() => {
            const selectedIds = Array.from(selectedSet);
            const parentA = simNodes.find((n) => n.id === selectedIds[0]);
            const parentB = simNodes.find((n) => n.id === selectedIds[1]);
            if (
              !parentA ||
              !parentB ||
              parentA.x == null ||
              parentB.x == null ||
              parentA.y == null ||
              parentB.y == null
            )
              return null;

            const midX = (parentA.x + parentB.x) / 2;
            const midY = (parentA.y + parentB.y) / 2;

            return Array.from(childSet).map((childId) => {
              const child = simNodes.find((n) => n.id === childId);
              if (!child || child.x == null || child.y == null) return null;

              const tgtR = nodeRadius(child.degree, maxDegree, child.isPairOfCenter);
              const dx = child.x - midX;
              const dy = child.y - midY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return null;

              return (
                <line
                  key={`merged-${childId}`}
                  x1={midX}
                  y1={midY}
                  x2={child.x - (dx / dist) * tgtR}
                  y2={child.y - (dy / dist) * tgtR}
                  stroke={COLOR_CHILD_HIGHLIGHT}
                  strokeWidth={2.5}
                  markerEnd={`url(#${getArrowMarkerId(COLOR_CHILD_HIGHLIGHT)})`}
                  style={{ transition: "stroke-width 0.2s" }}
                />
              );
            });
          })()} */}

        {/* Nodes */}
        {simNodes.map((node) => {
          if (node.x == null || node.y == null) return null;
          const r = nodeRadius(node.degree, maxDegree, node.isPairOfCenter);
          const fontSize = Math.max(BASE_FONT_SIZE, r * 0.5);
          const hasImage = !!node.imageUrl;
          const opacity = getNodeOpacity(node);
          const isSelected = selectedSet.has(node.id);
          const sexDotColor =
            node.sex === "M" || node.sex === "MALE"
              ? "#2383E2"
              : node.sex === "F" || node.sex === "FEMALE"
                ? "#E03E3E"
                : "#9ca3af";
          const labelY = node.y + r + fontSize + 2;
          const dotRadius = fontSize * 0.3;

          return (
            <g
              key={node.id}
              data-node
              style={{ cursor: "pointer", transition: "opacity 0.2s" }}
              opacity={opacity}
              onMouseEnter={() => {
                setHoveredNodeId(node.id);
                onNodeHover?.(node.id);
              }}
              onMouseLeave={() => {
                setHoveredNodeId(null);
                onNodeHover?.(null);
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(node.id, { x: e.clientX, y: e.clientY })}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNodeContextMenu?.(node.id, { x: e.clientX, y: e.clientY });
              }}
            >
              {/* 검색 포커스 글로우 — 노드 뒤에 렌더 */}
              {highlightFocusedId === node.id && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 6}
                  fill="#fbbf24"
                  filter="url(#node-focus-glow)"
                  style={{
                    pointerEvents: "none",
                    animation: "nodeGlowPulse 2s ease-out forwards",
                  }}
                />
              )}

              {hasImage ? (
                <g transform={`translate(${node.x}, ${node.y})`}>
                  <image
                    href={node.imageUrl}
                    x={-r}
                    y={-r}
                    width={r * 2}
                    height={r * 2}
                    clipPath={`url(#clip-${node.id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <circle
                    r={r}
                    fill="none"
                    stroke={
                      isSelected
                        ? isDark
                          ? COLOR_PAIR_EDGE_DARK
                          : COLOR_PAIR_EDGE
                        : getNodeColor(node)
                    }
                    strokeWidth={isSelected ? 3 : 2}
                    style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
                  />
                  {node.isPrivate && (
                    <circle
                      r={r}
                      fill="none"
                      stroke={isDark ? "#6b7280" : "#9ca3af"}
                      strokeWidth={2}
                      strokeDasharray="5 3"
                    />
                  )}
                </g>
              ) : (
                <>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={getNodeColor(node)}
                    style={{ transition: "fill 0.2s" }}
                  />
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r + 3}
                      fill="none"
                      stroke={isDark ? COLOR_PAIR_EDGE_DARK : COLOR_PAIR_EDGE}
                      strokeWidth={3}
                      style={{ transition: "stroke 0.2s" }}
                    />
                  )}
                  {node.isPrivate && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={r + 2}
                      fill="none"
                      stroke={isDark ? "#6b7280" : "#9ca3af"}
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                    />
                  )}
                </>
              )}

              {/* 세대 배지 */}
              {node.generation != null && (
                <g style={{ pointerEvents: "none" }}>
                  <circle
                    cx={node.x + r * 0.7}
                    cy={node.y - r * 0.7}
                    r={7}
                    fill={isDark ? "#374151" : "#f3f4f6"}
                    stroke={isDark ? "#6b7280" : "#d1d5db"}
                    strokeWidth={0.5}
                  />
                  <text
                    x={node.x + r * 0.7}
                    y={node.y - r * 0.7}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={7}
                    fill={isDark ? "#9ca3af" : "#6b7280"}
                    style={{ userSelect: "none" }}
                  >
                    G{node.generation}
                  </text>
                </g>
              )}

              {/* 비공개 자물쇠 배지 (좌상단, 세대 배지 반대편) */}
              {node.isPrivate && (
                <g style={{ pointerEvents: "none" }}>
                  <circle
                    cx={node.x - r * 0.7}
                    cy={node.y - r * 0.7}
                    r={7}
                    fill={isDark ? "#1f2937" : "#f9fafb"}
                    stroke={isDark ? "#4b5563" : "#d1d5db"}
                    strokeWidth={0.8}
                  />
                  <g transform={`translate(${node.x - r * 0.7}, ${node.y - r * 0.7})`}>
                    <path
                      d="M -2,-1 L -2,-2.8 A 2,2 0 0 1 2,-2.8 L 2,-1"
                      fill="none"
                      stroke={isDark ? "#9ca3af" : "#6b7280"}
                      strokeWidth={1.3}
                      strokeLinecap="round"
                    />
                    <rect
                      x={-3}
                      y={-1}
                      width={6}
                      height={4.5}
                      rx={0.8}
                      fill={isDark ? "#9ca3af" : "#6b7280"}
                    />
                  </g>
                </g>
              )}

              {/* 성별 dot + 이름 라벨 */}
              <g opacity={getLabelOpacity(node)} style={{ transition: "opacity 0.2s" }}>
                <circle
                  cx={node.x - node.label.length * fontSize * 0.3 - dotRadius - 1}
                  cy={labelY - fontSize * 0.35}
                  r={dotRadius}
                  fill={sexDotColor}
                  style={{ pointerEvents: "none" }}
                />
                <text
                  x={node.x}
                  y={labelY}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fill={isDark ? "#d1d5db" : "#374151"}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.label}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
