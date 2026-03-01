"use client";

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
  const prediction = predictOffspring(morphsA, morphsB);

  if (prediction.genes.length === 0) {
    return (
      <div className="pointer-events-auto flex w-full md:w-52 flex-col gap-2 rounded-xl border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90">
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">자식 예측</span>
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">
          예측 가능한 유전 정보 없음
        </p>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-auto flex flex-col gap-2 rounded-xl border border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 dark:border-gray-700 dark:bg-gray-900/90 ${"w-full md:w-52 p-3"}`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-medium text-gray-500 dark:text-gray-400`}>
          자식 예측
        </span>
      </div>

      <div className="space-y-2">
        {prediction.genes.map((g) => (
          <GeneSection key={g.gene} gene={g} nameA={nameA} nameB={nameB} />
        ))}
      </div>
    </div>
  );
}

function GeneSection({
  gene,
  nameA,
  nameB,
}: {
  gene: GenePrediction;
  nameA: string;
  nameB: string;
}) {
  const typeLabel = gene.type === "codominant" ? "공우성" : "열성";

  return (
    <div className={`rounded-lg border border-gray-100 p-1.5 dark:border-gray-800`}>
      {/* 유전자 헤더 */}
      <div className={`mb-1 flex items-center justify-between`}>
        <span className={`text-[11px] font-semibold text-gray-700 dark:text-gray-200`}>
          {gene.gene}
        </span>
        <span className={`text-[9px] text-gray-400 dark:text-gray-500`}>{typeLabel}</span>
      </div>

      {/* 부모 상태 */}
      <div className={`mb-1 flex gap-1.5 text-[9px]`}>
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          {truncateName(nameA)}: {geneStatusLabel(gene.parentA)}
        </span>
        <span className="rounded bg-pink-50 px-1.5 py-0.5 text-pink-600 dark:bg-pink-950 dark:text-pink-400">
          {truncateName(nameB)}: {geneStatusLabel(gene.parentB)}
        </span>
      </div>

      {/* 자식 비율 바 */}
      <div className="space-y-0.5">
        {gene.outcomes.map((outcome) => (
          <div key={outcome.label} className={`flex items-center gap-1`}>
            <div
              className={`h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800`}
            >
              <div
                className="h-full rounded-full bg-indigo-400 dark:bg-indigo-500"
                style={{ width: `${outcome.probability * 100}%` }}
              />
            </div>
            <span
              className={`shrink-0 truncate text-right text-[9px] text-gray-600 dark:text-gray-300`}
            >
              {outcome.label}
            </span>
            <span
              className={`shrink-0 text-right text-[9px] font-medium text-gray-500 tabular-nums dark:text-gray-400`}
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
