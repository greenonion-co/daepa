"use client";

import { GROWTH_KOREAN_INFO, MORPH_LIST_BY_SPECIES } from "../../constants";
import SelectFilter from "../../components/SelectFilter";
import { cn } from "@/lib/utils";
import MultiSelectFilter from "../../components/MultiSelectFilter";
import { PetControllerFindAllParams } from "@repo/api-client";

export function Filters({
  searchFilters,
  setSearchFilters,
}: {
  searchFilters: Partial<PetControllerFindAllParams>;
  setSearchFilters: (filters: Partial<PetControllerFindAllParams>) => void;
}) {
  const handleResetFilters = () => {
    setSearchFilters({});
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="flex h-[32px] items-center gap-2 rounded-lg bg-gray-100 px-1">
        <button
          onClick={() => setSearchFilters({ ...searchFilters, isPublic: undefined })}
          className={cn(
            "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800",
            searchFilters.isPublic === undefined ? "bg-white shadow-sm" : "text-gray-600",
          )}
        >
          전체
        </button>
        <button
          onClick={() => setSearchFilters({ ...searchFilters, isPublic: 1 })}
          className={cn(
            "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800",
            searchFilters.isPublic === 1 ? "bg-white shadow-sm" : "text-gray-600",
          )}
        >
          공개
        </button>
        <button
          onClick={() => setSearchFilters({ ...searchFilters, isPublic: 0 })}
          className={cn(
            "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800",
            searchFilters.isPublic === 0 ? "bg-white shadow-sm" : "text-gray-600",
          )}
        >
          비공개
        </button>
      </div>

      <SelectFilter
        type="species"
        initialItem={searchFilters.species}
        onSelect={(item) => {
          if (item === searchFilters.species) return;

          // TODO!: 종 변경 시 부, 모 개체 초기화(해칭룸)
          setSearchFilters({
            ...searchFilters,
            species: item,
            morphs: undefined,
          });
        }}
      />
      {searchFilters.species && (
        <MultiSelectFilter
          type="morphs"
          title="모프"
          displayMap={MORPH_LIST_BY_SPECIES[searchFilters.species]}
        />
      )}
      <MultiSelectFilter type="growth" title="크기" displayMap={GROWTH_KOREAN_INFO} />
      <SelectFilter
        type="sex"
        initialItem={searchFilters.sex}
        onSelect={(item) => setSearchFilters({ ...searchFilters, sex: item })}
      />
      {/* <SelectFilter
        type="foods"
        initialItem={searchFilters.foods}
        onSelect={(item) => setSearchFilters({ ...searchFilters, foods: item })}
      /> */}

      <button
        onClick={handleResetFilters}
        className="h-[32px] cursor-pointer rounded-lg px-3 text-sm text-blue-700 underline hover:bg-blue-100"
      >
        필터 리셋
      </button>
    </div>
  );
}
