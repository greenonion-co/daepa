"use client";

import { useState } from "react";
import { getMorphOrTraitColor } from "@/app/(브리더스룸)/hatching/components/Charts/morphColors";

/** 노드 컬러링과 동일한 보정 함수 */
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

interface EdgeIconProps {
  color: string;
  strokeWidth?: number;
  hasArrow?: boolean;
}

function EdgeIcon({ color, strokeWidth = 1.5, hasArrow = false }: EdgeIconProps) {
  return (
    <svg width="26" height="8" viewBox="0 0 26 8" className="shrink-0">
      <line
        x1="1"
        y1="4"
        x2={hasArrow ? "17" : "25"}
        y2="4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {hasArrow && <path d="M 15 1.5 L 23 4 L 15 6.5 Z" fill={color} />}
    </svg>
  );
}

interface MorphLegendProps {
  /** 현재 그래프에 존재하는 모프 목록 (중복 제거됨) */
  morphs: string[];
}

export default function MorphLegend({ morphs }: MorphLegendProps) {
  const [open, setOpen] = useState(false);

  const isDark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const edgeLegend = [
    {
      color: isDark ? "#a78bfa" : "#c084fc",
      label: "배우자 연결",
      hasArrow: false,
      strokeWidth: 1.5,
    },
    {
      color: "#22d3ee",
      label: "부모-자식",
      hasArrow: true,
      strokeWidth: 1.5,
    },
    {
      color: "#f97316",
      label: "부모 (hover)",
      hasArrow: true,
      strokeWidth: 2,
    },
  ];

  const hasMorphs = morphs.length > 0;

  if (!open) {
    return (
      <button
        type="button"
        className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/90 dark:hover:bg-gray-800"
        onClick={() => setOpen(true)}
        title="범례"
      >
        <svg width={14} height={14} viewBox="0 0 20 20" fill="none">
          <circle
            cx="10"
            cy="10"
            r="9"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-gray-400 dark:text-gray-500"
          />
          <text
            x="10"
            y="14.5"
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="currentColor"
            className="text-gray-500 dark:text-gray-400"
          >
            i
          </text>
        </svg>
      </button>
    );
  }

  return (
    <div className="pointer-events-auto rounded-xl border border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90">
      {/* 헤더 */}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-2.5 py-2"
        onClick={() => setOpen(false)}
      >
        <svg width={14} height={14} viewBox="0 0 20 20" fill="none" className="shrink-0">
          <circle
            cx="10"
            cy="10"
            r="9"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-gray-400 dark:text-gray-500"
          />
          <text
            x="10"
            y="14.5"
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="currentColor"
            className="text-gray-500 dark:text-gray-400"
          >
            i
          </text>
        </svg>
        <svg
          width={10}
          height={10}
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-gray-400"
        >
          <line x1="2" y1="2" x2="8" y2="8" />
          <line x1="8" y1="2" x2="2" y2="8" />
        </svg>
      </button>

      <div className="px-3 pb-2">
        {/* 선 색상 범례 */}
        <p className="mb-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">선</p>
        <div className="flex flex-col gap-1">
          {edgeLegend.map(({ color, label, hasArrow, strokeWidth }) => (
            <div key={label} className="flex items-center gap-1.5">
              <EdgeIcon color={color} strokeWidth={strokeWidth} hasArrow={hasArrow} />
              <span className="text-[10px] text-gray-600 dark:text-gray-300">{label}</span>
            </div>
          ))}
        </div>

        {/* 모프 색상 범례 */}
        {hasMorphs && (
          <>
            <p className="mt-2.5 mb-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
              노드
            </p>
            <div className="flex max-h-36 flex-col gap-1 overflow-y-auto">
              {morphs.map((morph) => {
                const rawColor = getMorphOrTraitColor(morph);
                const color = adjustMorphColorForTheme(rawColor, isDark);
                return (
                  <div key={morph} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] text-gray-600 dark:text-gray-300">{morph}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
