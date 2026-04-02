import { memo } from "react";
import type { GraphNode } from "../lib/types";
import { getSexDotColor } from "../lib/force-graph-utils";
import {
  BASE_FONT_SIZE,
  COLOR_PAIR_EDGE,
  COLOR_PAIR_EDGE_DARK,
} from "../lib/force-graph-constants";

interface GraphNodeElementProps {
  node: GraphNode;
  /** d3가 in-place mutate하므로 primitive로 전달 (memo 비교용) */
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  labelOpacity: number;
  isSelected: boolean;
  isDark: boolean;
  isFocused: boolean;
  onMouseEnter: (nodeId: string) => void;
  onMouseLeave: () => void;
  onPointerDown: (e: React.PointerEvent, nodeId: string) => void;
  onClick: (nodeId: string, position: { x: number; y: number }) => void;
  onContextMenu?: (nodeId: string, position: { x: number; y: number }) => void;
}

function GraphNodeElementInner({
  node,
  x,
  y,
  radius: r,
  color,
  opacity,
  labelOpacity,
  isSelected,
  isDark,
  isFocused,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
  onClick,
  onContextMenu,
}: GraphNodeElementProps) {
  const fontSize = Math.max(BASE_FONT_SIZE, r * 0.5);
  const hasImage = !!node.imageUrl;
  const sexDotColor = getSexDotColor(node.sex);
  const labelY = y + r + fontSize + 2;
  const dotRadius = fontSize * 0.3;

  return (
    <g
      data-node
      style={{ cursor: "pointer", transition: "opacity 0.2s" }}
      opacity={opacity}
      onMouseEnter={() => onMouseEnter(node.id)}
      onMouseLeave={onMouseLeave}
      onPointerDown={(e) => onPointerDown(e, node.id)}
      onClick={(e) => onClick(node.id, { x: e.clientX, y: e.clientY })}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(node.id, { x: e.clientX, y: e.clientY });
      }}
    >
      {/* 검색 포커스 글로우 */}
      {isFocused && (
        <circle
          cx={x}
          cy={y}
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
        <g transform={`translate(${x}, ${y})`}>
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
                : color
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
            cx={x}
            cy={y}
            r={r}
            fill={color}
            style={{ transition: "fill 0.2s" }}
          />
          {isSelected && (
            <circle
              cx={x}
              cy={y}
              r={r + 3}
              fill="none"
              stroke={isDark ? COLOR_PAIR_EDGE_DARK : COLOR_PAIR_EDGE}
              strokeWidth={3}
              style={{ transition: "stroke 0.2s" }}
            />
          )}
          {node.isPrivate && (
            <circle
              cx={x}
              cy={y}
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
            cx={x + r * 0.7}
            cy={y - r * 0.7}
            r={7}
            fill={isDark ? "#374151" : "#f3f4f6"}
            stroke={isDark ? "#6b7280" : "#d1d5db"}
            strokeWidth={0.5}
          />
          <text
            x={x + r * 0.7}
            y={y - r * 0.7}
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

      {/* 브리더 별 배지 — 좌상단 (비공개가 아닐 때만, 자물쇠와 위치 공유) */}
      {node.isBreeder && !node.isPrivate && (
        <g style={{ pointerEvents: "none" }}>
          <circle
            cx={x - r * 0.7}
            cy={y - r * 0.7}
            r={7}
            fill={isDark ? "#451a03" : "#fffbeb"}
            stroke="#f59e0b"
            strokeWidth={0.8}
          />
          <path
            d="M0,-3.8 L0.9,-1.2 L3.6,-1.2 L1.35,0.5 L2.25,3.1 L0,1.3 L-2.25,3.1 L-1.35,0.5 L-3.6,-1.2 L-0.9,-1.2 Z"
            fill="#f59e0b"
            transform={`translate(${x - r * 0.7}, ${y - r * 0.7}) scale(1.3)`}
          />
        </g>
      )}

      {/* 비공개 자물쇠 배지 */}
      {node.isPrivate && (
        <g style={{ pointerEvents: "none" }}>
          <circle
            cx={x - r * 0.7}
            cy={y - r * 0.7}
            r={7}
            fill={isDark ? "#1f2937" : "#f9fafb"}
            stroke={isDark ? "#4b5563" : "#d1d5db"}
            strokeWidth={0.8}
          />
          <g transform={`translate(${x - r * 0.7}, ${y - r * 0.7})`}>
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

      {/* 성별 dot + 이름 라벨 + 브리더 배지 */}
      <g opacity={labelOpacity} style={{ transition: "opacity 0.2s" }}>
        <circle
          cx={x - node.label.length * fontSize * 0.3 - dotRadius - 1}
          cy={labelY - fontSize * 0.35}
          r={dotRadius}
          fill={sexDotColor}
          style={{ pointerEvents: "none" }}
        />
        <text
          x={x}
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
}

export const GraphNodeElement = memo(GraphNodeElementInner, (prev, next) => {
  if (prev.x !== next.x || prev.y !== next.y) return false;
  if (prev.color !== next.color) return false;
  if (prev.opacity !== next.opacity) return false;
  if (prev.labelOpacity !== next.labelOpacity) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isDark !== next.isDark) return false;
  if (prev.isFocused !== next.isFocused) return false;
  if (prev.radius !== next.radius) return false;
  if (prev.node.id !== next.node.id) return false;
  if (prev.node.label !== next.node.label) return false;
  if (prev.node.imageUrl !== next.node.imageUrl) return false;
  if (prev.node.isPrivate !== next.node.isPrivate) return false;
  if (prev.node.isBreeder !== next.node.isBreeder) return false;
  if (prev.node.generation !== next.node.generation) return false;
  if (prev.node.sex !== next.node.sex) return false;
  return true;
});
