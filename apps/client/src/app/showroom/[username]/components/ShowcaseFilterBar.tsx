"use client";

import MultiSelect from "@/app/(브리더스룸)/components/selector/MultiSelect";

export interface ShowcaseFilters {
  sex: string[];
  status: string[];
  growth: string[];
  morphs: string[];
  traits: string[];
  search: string;
  sort: string;
}

interface ShowcaseFilterBarProps {
  filters: ShowcaseFilters;
  onChange: (filters: ShowcaseFilters) => void;
  availableMorphs: Record<string, string>;
  availableTraits: Record<string, string>;
  mobile?: boolean;
}

const SEX_DISPLAY: Record<string, string> = {
  M: "수컷",
  F: "암컷",
  N: "미구분",
};

const STATUS_DISPLAY: Record<string, string> = {
  ON_SALE: "분양중",
  ON_RESERVATION: "예약중",
  NFS: "NFS",
};

const GROWTH_DISPLAY: Record<string, string> = {
  BABY: "베이비",
  JUVENILE: "아성체",
  PRE_ADULT: "준성체",
  ADULT: "성체",
};

export default function ShowcaseFilterBar({
  filters,
  onChange,
  availableMorphs,
  availableTraits,
  mobile,
}: ShowcaseFilterBarProps) {
  const hasActiveFilters =
    filters.sex.length > 0 ||
    filters.status.length > 0 ||
    filters.growth.length > 0 ||
    filters.morphs.length > 0 ||
    filters.traits.length > 0;

  const handleReset = () => {
    onChange({ ...filters, sex: [], status: [], growth: [], morphs: [], traits: [] });
  };

  if (mobile) {
    return (
      <div className="flex flex-wrap gap-2">
        {Object.keys(availableMorphs).length > 0 && (
          <MultiSelect
            title="모프"
            displayMap={availableMorphs}
            selected={filters.morphs}
            onChange={(morphs) => onChange({ ...filters, morphs })}
            variant="light"
          />
        )}
        {Object.keys(availableTraits).length > 0 && (
          <MultiSelect
            title="형질"
            displayMap={availableTraits}
            selected={filters.traits}
            onChange={(traits) => onChange({ ...filters, traits })}
            variant="light"
          />
        )}
        <MultiSelect
          title="성별"
          displayMap={SEX_DISPLAY}
          selected={filters.sex}
          onChange={(sex) => onChange({ ...filters, sex })}
          variant="light"
        />
        <MultiSelect
          title="크기"
          displayMap={GROWTH_DISPLAY}
          selected={filters.growth}
          onChange={(growth) => onChange({ ...filters, growth })}
          variant="light"
        />
        <MultiSelect
          title="분양상태"
          displayMap={STATUS_DISPLAY}
          selected={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
          variant="light"
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            초기화
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
      <div className="relative p-2 text-center font-semibold text-gray-900 dark:text-gray-300">
        필터
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            초기화
          </button>
        )}
      </div>

      {Object.keys(availableMorphs).length > 0 && (
        <div className="flex flex-col gap-1.5 p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">모프</h3>
          <MultiSelect
            title="모프"
            displayMap={availableMorphs}
            selected={filters.morphs}
            onChange={(morphs) => onChange({ ...filters, morphs })}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">형질</h3>
        <MultiSelect
          title="형질"
          displayMap={availableTraits}
          selected={filters.traits}
          onChange={(traits) => onChange({ ...filters, traits })}
        />
      </div>

      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">성별</h3>
        <MultiSelect
          title="성별"
          displayMap={SEX_DISPLAY}
          selected={filters.sex}
          onChange={(sex) => onChange({ ...filters, sex })}
        />
      </div>

      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">크기</h3>
        <MultiSelect
          title="크기"
          displayMap={GROWTH_DISPLAY}
          selected={filters.growth}
          onChange={(growth) => onChange({ ...filters, growth })}
        />
      </div>

      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">분양상태</h3>
        <MultiSelect
          title="분양상태"
          displayMap={STATUS_DISPLAY}
          selected={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
        />
      </div>
    </div>
  );
}
