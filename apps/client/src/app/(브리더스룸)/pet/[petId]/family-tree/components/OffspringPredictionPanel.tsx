"use client";

import { useState } from "react";
import { predictOffspring, geneStatusLabel, type GenePrediction } from "../lib/genetics";

interface OffspringPredictionPanelProps {
  morphsA: string[];
  morphsB: string[];
  nameA: string;
  nameB: string;
}

export default function OffspringPredictionPanel({
  morphsA,
  morphsB,
  nameA,
  nameB,
}: OffspringPredictionPanelProps) {
  // const [expanded, setExpanded] = useState(false);
  const [expanded] = useState(false);

  const prediction = predictOffspring(morphsA, morphsB);

  if (prediction.genes.length === 0) {
    return (
      <div className="pointer-events-auto flex w-52 flex-col gap-2 rounded-xl border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90">
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">자식 예측</span>
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
          예측 가능한 유전 정보 없음
        </p>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-auto flex flex-col gap-2 rounded-xl border border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 dark:border-gray-700 dark:bg-gray-900/90 ${
        expanded ? "w-80 p-4" : "w-52 p-3"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span
          className={`font-medium text-gray-500 dark:text-gray-400 ${expanded ? "text-sm" : "text-[11px]"}`}
        >
          자식 예측
        </span>
      </div>

      {/* 부모 이름 (확대 시) */}
      {expanded && (
        <div className="text-center text-sm text-gray-700 dark:text-gray-300">
          {nameA}
          <span className="mx-1 text-gray-400">&times;</span>
          {nameB}
        </div>
      )}

      <div className={expanded ? "space-y-3" : "space-y-2"}>
        {prediction.genes.map((g) => (
          <GeneSection key={g.gene} gene={g} nameA={nameA} nameB={nameB} isExpanded={expanded} />
        ))}
      </div>

      {/* 확대/축소 버튼 (우측 하단) */}
      {/* <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          title={expanded ? "축소" : "확대"}
        >
          {expanded ? <CollapseIcon size={12} /> : <ExpandIcon size={12} />}
        </button>
      </div> */}
    </div>
  );
}

function GeneSection({
  gene,
  nameA,
  nameB,
  isExpanded,
}: {
  gene: GenePrediction;
  nameA: string;
  nameB: string;
  isExpanded: boolean;
}) {
  const typeLabel = gene.type === "codominant" ? "공우성" : "열성";

  return (
    <div
      className={`rounded-lg border border-gray-100 dark:border-gray-800 ${isExpanded ? "p-3" : "p-1.5"}`}
    >
      {/* 유전자 헤더 */}
      <div className={`flex items-center justify-between ${isExpanded ? "mb-2" : "mb-1"}`}>
        <span
          className={`font-semibold text-gray-700 dark:text-gray-200 ${isExpanded ? "text-sm" : "text-[11px]"}`}
        >
          {gene.gene}
        </span>
        <span
          className={`text-gray-400 dark:text-gray-500 ${isExpanded ? "text-[11px]" : "text-[9px]"}`}
        >
          {typeLabel}
        </span>
      </div>

      {/* 부모 상태 */}
      <div className={`flex gap-1.5 ${isExpanded ? "mb-2 text-[11px]" : "mb-1 text-[9px]"}`}>
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          {isExpanded ? nameA : truncateName(nameA)}: {geneStatusLabel(gene.parentA)}
        </span>
        <span className="rounded bg-pink-50 px-1.5 py-0.5 text-pink-600 dark:bg-pink-950 dark:text-pink-400">
          {isExpanded ? nameB : truncateName(nameB)}: {geneStatusLabel(gene.parentB)}
        </span>
      </div>

      {/* 자식 비율 바 */}
      <div className={isExpanded ? "space-y-1.5" : "space-y-0.5"}>
        {gene.outcomes.map((outcome) => (
          <div
            key={outcome.label}
            className={`flex items-center ${isExpanded ? "gap-2" : "gap-1"}`}
          >
            <div
              className={`flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 ${isExpanded ? "h-2.5" : "h-1.5"}`}
            >
              <div
                className="h-full rounded-full bg-indigo-400 dark:bg-indigo-500"
                style={{ width: `${outcome.probability * 100}%` }}
              />
            </div>
            <span
              className={`shrink-0 truncate text-right text-gray-600 dark:text-gray-300 ${isExpanded ? "w-24 text-xs" : "w-16 text-[9px]"}`}
            >
              {outcome.label}
            </span>
            <span
              className={`shrink-0 text-right font-medium text-gray-500 tabular-nums dark:text-gray-400 ${isExpanded ? "w-10 text-xs" : "w-8 text-[9px]"}`}
            >
              {Math.round(outcome.probability * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function truncateName(name: string): string {
  return name.length > 4 ? name.slice(0, 4) + ".." : name;
}

// function ExpandIcon({ size = 14 }: { size?: number }) {
//   return (
//     <svg
//       width={size}
//       height={size}
//       viewBox="0 0 16 16"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.5"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <polyline points="10 2 14 2 14 6" />
//       <polyline points="6 14 2 14 2 10" />
//       <line x1="14" y1="2" x2="9" y2="7" />
//       <line x1="2" y1="14" x2="7" y2="9" />
//     </svg>
//   );
// }

// function CollapseIcon({ size = 14 }: { size?: number }) {
//   return (
//     <svg
//       width={size}
//       height={size}
//       viewBox="0 0 16 16"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.5"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <polyline points="4 10 0 10 0 14" />
//       <polyline points="12 6 16 6 16 2" />
//       <line x1="0" y1="14" x2="6" y2="8" />
//       <line x1="16" y1="2" x2="10" y2="8" />
//     </svg>
//   );
// }
