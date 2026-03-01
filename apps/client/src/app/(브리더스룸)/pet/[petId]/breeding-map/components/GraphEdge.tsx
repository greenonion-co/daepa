import { memo } from "react";
import type { GraphNode, GraphLink } from "../lib/types";
import { MIN_RADIUS } from "../lib/force-graph-constants";

interface GraphEdgeProps {
  link: GraphLink;
  /** d3가 in-place mutate하므로 primitive로 전달 (memo 비교용) */
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  nodeRadiusMap: Map<string, number>;
  color: string;
  width: number;
  arrowMarkerId: string;
  hidden: boolean;
}

function GraphEdgeInner({ link, sx, sy, tx, ty, nodeRadiusMap, color, width, arrowMarkerId, hidden }: GraphEdgeProps) {
  if (hidden) return null;

  const s = link.source as GraphNode;
  const t = link.target as GraphNode;
  const isOffspring = !link.isPair;
  let x1 = sx,
    y1 = sy,
    x2 = tx,
    y2 = ty;

  if (isOffspring) {
    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      const srcR = nodeRadiusMap.get(s.id) ?? MIN_RADIUS;
      const tgtR = nodeRadiusMap.get(t.id) ?? MIN_RADIUS;
      x1 = sx + (dx / dist) * srcR;
      y1 = sy + (dy / dist) * srcR;
      x2 = tx - (dx / dist) * tgtR;
      y2 = ty - (dy / dist) * tgtR;
    }
  }

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={width}
      markerEnd={isOffspring ? `url(#${arrowMarkerId})` : undefined}
      style={{ transition: "stroke-width 0.2s" }}
    />
  );
}

export const GraphEdge = memo(GraphEdgeInner, (prev, next) => {
  if (prev.sx !== next.sx || prev.sy !== next.sy) return false;
  if (prev.tx !== next.tx || prev.ty !== next.ty) return false;
  if (prev.hidden !== next.hidden) return false;
  if (prev.color !== next.color) return false;
  if (prev.width !== next.width) return false;
  if (prev.arrowMarkerId !== next.arrowMarkerId) return false;
  return true;
});
