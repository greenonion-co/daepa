"use client";

import {
  GENDER_KOREAN_INFO,
  GROWTH_KOREAN_INFO,
  MORPH_LIST_BY_SPECIES,
  SALE_STATUS_KOREAN_INFO,
  TRAIT_LIST_BY_SPECIES,
} from "../../constants";
import SelectFilter from "../../components/selector/SingleSelect";
import { cn } from "@/lib/utils";
import MultiSelectFilter from "../../components/selector/MultiSelect";
import { useFilterStore } from "../../store/filter";

interface FiltersProps {
  showPublicFilter?: boolean;
}

export function Filters({ showPublicFilter = true }: FiltersProps) {
  const { searchFilters, setSearchFilters, resetFilters } = useFilterStore();

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {showPublicFilter && (
        <div className="flex h-[32px] items-center gap-2 rounded-lg bg-gray-100 px-1 dark:bg-gray-800">
          <button
            onClick={() => setSearchFilters({ ...searchFilters, isPublic: undefined })}
            className={cn(
              "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200",
              searchFilters.isPublic === undefined
                ? "bg-white shadow-sm dark:bg-gray-700"
                : "text-gray-600 dark:text-gray-400",
            )}
          >
            전체
          </button>
          <button
            onClick={() => setSearchFilters({ ...searchFilters, isPublic: 1 })}
            className={cn(
              "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200",
              searchFilters.isPublic === 1
                ? "bg-white shadow-sm dark:bg-gray-700"
                : "text-gray-600 dark:text-gray-400",
            )}
          >
            공개
          </button>
          <button
            onClick={() => setSearchFilters({ ...searchFilters, isPublic: 0 })}
            className={cn(
              "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200",
              searchFilters.isPublic === 0
                ? "bg-white shadow-sm dark:bg-gray-700"
                : "text-gray-600 dark:text-gray-400",
            )}
          >
            비공개
          </button>
        </div>
      )}

      <SelectFilter
        showTitle
        showSelectAll
        type="species"
        initialItem={searchFilters.species}
        saveASAP
        onSelect={(item) => {
          if (item === searchFilters.species) return;

          setSearchFilters({
            ...searchFilters,
            species: item,
            morphs: undefined,
            traits: undefined,
          });
        }}
      />
      {searchFilters.species && (
        <>
          <MultiSelectFilter
            type="morphs"
            title="모프"
            displayMap={MORPH_LIST_BY_SPECIES[searchFilters.species]}
          />
          <MultiSelectFilter
            type="traits"
            title="형질"
            displayMap={TRAIT_LIST_BY_SPECIES[searchFilters.species]}
          />
        </>
      )}
      <MultiSelectFilter type="growth" title="크기" displayMap={GROWTH_KOREAN_INFO} />
      <MultiSelectFilter type="sex" title="성별" displayMap={GENDER_KOREAN_INFO} />
      <MultiSelectFilter type="status" title="분양상태" displayMap={SALE_STATUS_KOREAN_INFO} />
      {/* TODO: 먹이 필터 추가 */}

      <button
        onClick={resetFilters}
        className="h-[32px] cursor-pointer rounded-lg px-3 text-sm text-blue-700 underline hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
      >
        필터 리셋
      </button>
    </div>
  );
}
