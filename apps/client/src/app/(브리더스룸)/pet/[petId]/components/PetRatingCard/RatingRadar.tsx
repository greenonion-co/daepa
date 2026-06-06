"use client";

import { useRef } from "react";
import { RATING_LABELS, RATING_MAX } from "./rating.constants";

const VIEW = 240;
const C = VIEW / 2; // 중심
const R = 76; // 최대 점수(5)일 때 반지름
const LABEL_R = R + 22;
const N = RATING_LABELS.length;

const angleFor = (i: number) => (-90 + (360 / N) * i) * (Math.PI / 180);

function point(i: number, value: number) {
  const a = angleFor(i);
  const d = (value / RATING_MAX) * R;
  return { x: C + d * Math.cos(a), y: C + d * Math.sin(a) };
}

function polygon(values: number[]) {
  return values.map((v, i) => Object.values(point(i, v)).join(",")).join(" ");
}

interface RatingRadarProps {
  scores: number[];
  editable?: boolean;
  onChange?: (index: number, value: number) => void;
}

export function RatingRadar({ scores, editable, onChange }: RatingRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const activeRef = useRef<number | null>(null);

  const toView = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW,
      y: ((clientY - rect.top) / rect.height) * VIEW,
    };
  };

  // 포인터 위치를 해당 축에 투영해 0~5 점수로 변환
  const valueFromPointer = (i: number, x: number, y: number) => {
    const a = angleFor(i);
    const proj = (x - C) * Math.cos(a) + (y - C) * Math.sin(a);
    const clamped = Math.max(0, Math.min(R, proj));
    return Math.round((clamped / R) * RATING_MAX);
  };

  const handleDown = (i: number) => (e: React.PointerEvent) => {
    if (!editable) return;
    e.preventDefault();
    activeRef.current = i;
    svgRef.current?.setPointerCapture(e.pointerId);
    const { x, y } = toView(e.clientX, e.clientY);
    onChange?.(i, valueFromPointer(i, x, y));
  };

  const handleMove = (e: React.PointerEvent) => {
    if (activeRef.current === null) return;
    const { x, y } = toView(e.clientX, e.clientY);
    onChange?.(activeRef.current, valueFromPointer(activeRef.current, x, y));
  };

  const handleUp = (e: React.PointerEvent) => {
    if (activeRef.current === null) return;
    activeRef.current = null;
    svgRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="w-full touch-none select-none"
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      >
        {/* 그리드 링 (1~5) */}
        {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((level) => (
          <polygon
            key={level}
            points={polygon(Array(N).fill(level))}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}

        {/* 축 스포크 */}
        {RATING_LABELS.map((_, i) => {
          const p = point(i, RATING_MAX);
          return (
            <line
              key={i}
              x1={C}
              y1={C}
              x2={p.x}
              y2={p.y}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          );
        })}

        {/* 데이터 폴리곤 */}
        <polygon
          points={polygon(scores)}
          fill="#6366f1"
          fillOpacity={0.35}
          stroke="#6366f1"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* 라벨 */}
        {RATING_LABELS.map((label, i) => {
          const a = angleFor(i);
          const x = C + LABEL_R * Math.cos(a);
          const y = C + LABEL_R * Math.sin(a);
          const cos = Math.cos(a);
          const anchor = Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={11}
              fill="#6b7280"
            >
              {editable ? `${label} ${scores[i] ?? 0}` : label}
            </text>
          );
        })}

        {/* 편집 핸들 */}
        {editable &&
          scores.map((v, i) => {
            const p = point(i, v);
            return (
              <g key={i} className="cursor-pointer" onPointerDown={handleDown(i)}>
                {/* 넓은 히트 영역 */}
                <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={6}
                  fill="#ffffff"
                  stroke="#6366f1"
                  strokeWidth={2}
                />
              </g>
            );
          })}
      </svg>
    </div>
  );
}
