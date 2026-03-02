"use client";

import ShowcaseMultiSelect from "./ShowcaseMultiSelect";

export interface ShowcaseFilters {
  sex: string[];
  status: string[];
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

export default function ShowcaseFilterBar({
  filters,
  onChange,
  availableMorphs,
  availableTraits,
  mobile,
}: ShowcaseFilterBarProps) {
  if (mobile) {
    return (
      <div className="flex flex-wrap gap-2">
        <ShowcaseMultiSelect
          title="성별"
          displayMap={SEX_DISPLAY}
          selected={filters.sex}
          onChange={(sex) => onChange({ ...filters, sex })}
          variant="light"
        />
        <ShowcaseMultiSelect
          title="분양상태"
          displayMap={STATUS_DISPLAY}
          selected={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
          variant="light"
        />
        {Object.keys(availableMorphs).length > 0 && (
          <ShowcaseMultiSelect
            title="모프"
            displayMap={availableMorphs}
            selected={filters.morphs}
            onChange={(morphs) => onChange({ ...filters, morphs })}
            variant="light"
            dropdownPosition="right"
          />
        )}
        {Object.keys(availableTraits).length > 0 && (
          <ShowcaseMultiSelect
            title="형질"
            displayMap={availableTraits}
            selected={filters.traits}
            onChange={(traits) => onChange({ ...filters, traits })}
            variant="light"
            dropdownPosition="right"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
      <div className="p-2 text-center font-semibold text-gray-900 dark:text-gray-300">필터</div>

      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">성별</h3>
        <ShowcaseMultiSelect
          title="성별"
          displayMap={SEX_DISPLAY}
          selected={filters.sex}
          onChange={(sex) => onChange({ ...filters, sex })}
        />
      </div>

      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">분양상태</h3>
        <ShowcaseMultiSelect
          title="분양상태"
          displayMap={STATUS_DISPLAY}
          selected={filters.status}
          onChange={(status) => onChange({ ...filters, status })}
        />
      </div>

      {Object.keys(availableMorphs).length > 0 && (
        <div className="flex flex-col gap-1.5 p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">모프</h3>
          <ShowcaseMultiSelect
            title="모프"
            displayMap={availableMorphs}
            selected={filters.morphs}
            onChange={(morphs) => onChange({ ...filters, morphs })}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">형질</h3>
        <ShowcaseMultiSelect
          title="형질"
          displayMap={availableTraits}
          selected={filters.traits}
          onChange={(traits) => onChange({ ...filters, traits })}
        />
      </div>
    </div>
  );
}
