import { getMorphOrTraitColor } from "@/app/(브리더스룸)/hatching/components/Charts/morphColors";
import type { GraphNode, GraphLink } from "./types";
import {
  MIN_RADIUS,
  MAX_RADIUS,
  PAIR_RADIUS_BOOST,
  COLOR_DEFAULT_NODE,
  COLOR_DEFAULT_EDGE,
  COLOR_HOVER_NODE,
  COLOR_HOVER_CENTER,
  COLOR_HOVER_EDGE,
  COLOR_FADED,
  COLOR_FADED_DARK,
  COLOR_COI_PATH,
  COLOR_COI_PATH_WIDTH,
  COLOR_PAIR_EDGE,
  COLOR_PAIR_EDGE_DARK,
  COLOR_HOVER_PAIR_EDGE,
  COLOR_PARENT_EDGE,
  COLOR_CHILD_HIGHLIGHT,
  COLOR_SIBLING,
  COLOR_DEFAULT_EDGE_DARK,
  COLOR_FADED_EDGE,
  COLOR_FADED_EDGE_DARK,
  COLOR_SELECTED_RING,
} from "./force-graph-constants";

// ─── 유틸리티 함수 ───

export function getLinkSourceId(link: GraphLink): string {
  return typeof link.source === "string" ? link.source : link.source.id;
}

export function getLinkTargetId(link: GraphLink): string {
  return typeof link.target === "string" ? link.target : link.target.id;
}

export function adjustMorphColorForTheme(hex: string, isDark: boolean): string {
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

export function nodeRadius(degree: number, maxDegree: number, isPairOfCenter?: boolean): number {
  if (maxDegree <= 1) return MIN_RADIUS + 4 + (isPairOfCenter ? PAIR_RADIUS_BOOST : 0);
  const t = degree / maxDegree;
  const base = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
  return base + (isPairOfCenter ? PAIR_RADIUS_BOOST : 0);
}

export function screenToSvg(
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

export function getSexDotColor(sex?: string): string {
  if (sex === "M" || sex === "MALE") return "#2383E2";
  if (sex === "F" || sex === "FEMALE") return "#E03E3E";
  return "#9ca3af";
}

// ─── 스타일 컨텍스트 ───

export interface StyleContext {
  hoveredNodeId: string | null;
  isDark: boolean;
  highlightSelected: boolean;
  selectedSet: Set<string>;
  coiNodeSet: Set<string>;
  coiEdgeSet: Set<string>;
  childSet: Set<string>;
  siblingSet: Set<string>;
  connectedMap: Map<string, Set<string>>;
  simNodes: GraphNode[];
  maxDegree: number;
}

// ─── 판별 함수 ───

function isConnected(nodeId: string, ctx: StyleContext): boolean {
  if (!ctx.hoveredNodeId) return false;
  if (nodeId === ctx.hoveredNodeId) return true;
  return ctx.connectedMap.get(ctx.hoveredNodeId)?.has(nodeId) ?? false;
}

function isPairEdge(link: GraphLink): boolean {
  const s = link.source as GraphNode;
  const t = link.target as GraphNode;
  return s.generation != null && t.generation != null && s.generation === t.generation;
}

function isEdgeConnected(link: GraphLink, hoveredNodeId: string | null): boolean {
  if (!hoveredNodeId) return false;
  const s = getLinkSourceId(link);
  const t = getLinkTargetId(link);
  return s === hoveredNodeId || t === hoveredNodeId;
}

function isParentOfHovered(link: GraphLink, ctx: StyleContext): boolean {
  if (!ctx.hoveredNodeId) return false;
  const hoveredNode = ctx.simNodes.find((n) => n.id === ctx.hoveredNodeId);
  if (!hoveredNode) return false;
  const s = getLinkSourceId(link);
  const t = getLinkTargetId(link);
  if (t === ctx.hoveredNodeId && (s === hoveredNode.fatherId || s === hoveredNode.motherId))
    return true;
  if (s === ctx.hoveredNodeId && (t === hoveredNode.fatherId || t === hoveredNode.motherId))
    return true;
  return false;
}

function isCoiPathEdge(link: GraphLink, coiEdgeSet: Set<string>): boolean {
  if (coiEdgeSet.size === 0) return false;
  const s = getLinkSourceId(link);
  const t = getLinkTargetId(link);
  return coiEdgeSet.has(`${s}-${t}`);
}

function isEdgeBetweenSelected(link: GraphLink, selectedSet: Set<string>): boolean {
  const s = getLinkSourceId(link);
  const t = getLinkTargetId(link);
  return selectedSet.has(s) && selectedSet.has(t);
}

function isEdgeToChild(link: GraphLink, selectedSet: Set<string>, childSet: Set<string>): boolean {
  if (childSet.size === 0) return false;
  const s = getLinkSourceId(link);
  const t = getLinkTargetId(link);
  return (selectedSet.has(s) && childSet.has(t)) || (selectedSet.has(t) && childSet.has(s));
}

function getMorphColor(node: GraphNode, isDark: boolean): string {
  const firstMorph = node.morphs?.[0];
  if (firstMorph) {
    return adjustMorphColorForTheme(getMorphOrTraitColor(firstMorph), isDark);
  }
  return isDark ? "#94a3b8" : COLOR_DEFAULT_NODE;
}

// ─── 스타일 계산 순수함수 ───

export function computeNodeColor(node: GraphNode, ctx: StyleContext): string {
  if (ctx.highlightSelected && ctx.selectedSet.size > 0) {
    if (ctx.selectedSet.has(node.id)) return ctx.isDark ? COLOR_PAIR_EDGE_DARK : COLOR_PAIR_EDGE;
    if (ctx.childSet.has(node.id)) return COLOR_CHILD_HIGHLIGHT;
    if (ctx.coiNodeSet.has(node.id)) return getMorphColor(node, ctx.isDark);
    return ctx.isDark ? COLOR_FADED_DARK : COLOR_FADED;
  }
  if (!ctx.hoveredNodeId) return getMorphColor(node, ctx.isDark);
  if (node.id === ctx.hoveredNodeId) return COLOR_HOVER_CENTER;
  if (isConnected(node.id, ctx)) {
    const hoveredNode = ctx.simNodes.find((n) => n.id === ctx.hoveredNodeId);
    if (hoveredNode && (node.id === hoveredNode.fatherId || node.id === hoveredNode.motherId)) {
      return COLOR_PARENT_EDGE;
    }
    const hoveredGen = hoveredNode?.generation;
    if (hoveredGen != null && node.generation != null && hoveredGen === node.generation) {
      return COLOR_HOVER_PAIR_EDGE;
    }
    return COLOR_HOVER_NODE;
  }
  if (ctx.siblingSet.has(node.id)) return COLOR_SIBLING;
  return ctx.isDark ? COLOR_FADED_DARK : COLOR_FADED;
}

export function computeEdgeColor(link: GraphLink, ctx: StyleContext): string {
  if (ctx.highlightSelected && ctx.selectedSet.size > 0) {
    if (isEdgeBetweenSelected(link, ctx.selectedSet))
      return ctx.isDark ? COLOR_PAIR_EDGE_DARK : COLOR_PAIR_EDGE;
    if (isEdgeToChild(link, ctx.selectedSet, ctx.childSet)) return COLOR_CHILD_HIGHLIGHT;
    if (isCoiPathEdge(link, ctx.coiEdgeSet)) return COLOR_COI_PATH;
    return ctx.isDark ? COLOR_FADED_EDGE_DARK : COLOR_FADED_EDGE;
  }
  if (!ctx.hoveredNodeId) {
    if (isPairEdge(link)) return ctx.isDark ? COLOR_PAIR_EDGE_DARK : COLOR_PAIR_EDGE;
    return ctx.isDark ? COLOR_DEFAULT_EDGE_DARK : COLOR_DEFAULT_EDGE;
  }
  if (isParentOfHovered(link, ctx)) return COLOR_PARENT_EDGE;
  if (isEdgeConnected(link, ctx.hoveredNodeId))
    return isPairEdge(link) ? COLOR_HOVER_PAIR_EDGE : COLOR_HOVER_EDGE;
  return ctx.isDark ? COLOR_FADED_EDGE_DARK : COLOR_FADED_EDGE;
}

export function computeEdgeWidth(link: GraphLink, ctx: StyleContext): number {
  if (ctx.highlightSelected && ctx.selectedSet.size > 0) {
    if (isEdgeBetweenSelected(link, ctx.selectedSet)) return 2.5;
    if (isEdgeToChild(link, ctx.selectedSet, ctx.childSet)) return 2.5;
    if (isCoiPathEdge(link, ctx.coiEdgeSet)) return COLOR_COI_PATH_WIDTH;
    return 0.5;
  }
  if (!ctx.hoveredNodeId) return 1;
  if (isParentOfHovered(link, ctx)) return 3;
  if (isEdgeConnected(link, ctx.hoveredNodeId)) return 2.5;
  return 0.5;
}

export function computeEdgeHidden(
  link: GraphLink,
  highlightSelected: boolean,
  selectedSet: Set<string>,
  childSet: Set<string>,
): boolean {
  return (
    highlightSelected &&
    selectedSet.size === 2 &&
    childSet.size > 0 &&
    isEdgeToChild(link, selectedSet, childSet)
  );
}

export function computeArrowMarkerId(color: string): string {
  if (color === COLOR_PARENT_EDGE) return "arrowhead-parent";
  if (color === COLOR_CHILD_HIGHLIGHT) return "arrowhead-child-hl";
  if (color === COLOR_HOVER_EDGE) return "arrowhead-hover";
  if (color === COLOR_COI_PATH) return "arrowhead-coi";
  if (color === COLOR_SELECTED_RING) return "arrowhead-selected";
  if (color === COLOR_FADED_EDGE) return "arrowhead-faded-light";
  if (color === COLOR_FADED_EDGE_DARK) return "arrowhead-faded-dark";
  if (color === COLOR_DEFAULT_EDGE_DARK) return "arrowhead-dark";
  return "arrowhead";
}

export function computeNodeOpacity(node: GraphNode, ctx: StyleContext): number {
  if (ctx.highlightSelected && ctx.selectedSet.size > 0) {
    return ctx.selectedSet.has(node.id) || ctx.childSet.has(node.id) || ctx.coiNodeSet.has(node.id)
      ? 1
      : 0.15;
  }
  if (!ctx.hoveredNodeId) return 1;
  if (isConnected(node.id, ctx)) return 1;
  if (ctx.siblingSet.has(node.id)) return 0.85;
  return 0.2;
}

export function computeLabelOpacity(node: GraphNode, ctx: StyleContext): number {
  if (ctx.highlightSelected && ctx.selectedSet.size > 0) {
    return ctx.selectedSet.has(node.id) || ctx.childSet.has(node.id) || ctx.coiNodeSet.has(node.id)
      ? 1
      : 0.1;
  }
  if (!ctx.hoveredNodeId) {
    if (ctx.isDark) return node.degree >= ctx.maxDegree * 0.3 ? 0.9 : 0.7;
    return node.degree >= ctx.maxDegree * 0.3 ? 0.7 : 0.4;
  }
  if (isConnected(node.id, ctx)) return 1;
  if (ctx.siblingSet.has(node.id)) return 0.8;
  return 0.1;
}
