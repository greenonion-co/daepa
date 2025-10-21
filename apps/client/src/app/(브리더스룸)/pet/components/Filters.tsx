"use client";

import { Table } from "@tanstack/react-table";
import { MORPH_LIST_BY_SPECIES } from "../../constants";
import { FilterStore } from "../../store/filter";
import SelectFilter from "../../components/SelectFilter";
import { cn } from "@/lib/utils";
import MultiSelectFilter from "../../components/MultiSelectFilter";
import { PetDtoSpecies } from "@repo/api-client";

type AnyParams = Record<string, string | number | string[] | number[]>;
interface FiltersProps<TData, TParams extends AnyParams = AnyParams> extends FilterStore<TParams> {
  table: Table<TData>;
  placeholder?: string;
}

export function Filters<TData, TParams extends AnyParams = AnyParams>({
  searchFilters,
  setSearchFilters,
}: FiltersProps<TData, TParams>) {
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
          if (!item) {
            setSearchFilters({ ...searchFilters, morphs: undefined });
          }
          setSearchFilters({ ...searchFilters, species: item });
        }}
      />
      {searchFilters.species && (
        <MultiSelectFilter
          type="morphs"
          title="모프"
          selectList={MORPH_LIST_BY_SPECIES[searchFilters.species as PetDtoSpecies]}
        />
      )}
      <SelectFilter
        type="growth"
        initialItem={searchFilters.growth}
        onSelect={(item) => setSearchFilters({ ...searchFilters, growth: item })}
      />
      <SelectFilter
        type="sex"
        initialItem={searchFilters.sex}
        onSelect={(item) => setSearchFilters({ ...searchFilters, sex: item })}
      />
      <SelectFilter
        type="foods"
        initialItem={searchFilters.foods}
        onSelect={(item) => setSearchFilters({ ...searchFilters, foods: item })}
      />

      <button
        onClick={handleResetFilters}
        className="h-[32px] cursor-pointer rounded-lg px-3 text-sm text-blue-700 underline hover:bg-blue-100"
      >
        필터 되돌리기
      </button>
    </div>
  );
}
