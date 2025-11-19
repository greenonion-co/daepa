"use client";

import {
  MORPH_LIST_BY_SPECIES,
  TRAIT_LIST_BY_SPECIES,
  GROWTH_KOREAN_INFO,
  GENDER_KOREAN_INFO,
} from "../../constants";
import SelectFilter from "../../components/SingleSelect";
import AdoptionMultiSelectFilter from "./AdoptionMultiSelectFilter";
import { useAdoptionFilterStore } from "../../store/adoptionFilter";
import AdoptionPriceRangeFilter from "./AdoptionPriceRangeFilter";

export function AdoptionFilters() {
  const { searchFilters, setSearchFilters, resetFilters } = useAdoptionFilterStore();

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SelectFilter
        showTitle
        type="species"
        initialItem={searchFilters.species}
        onSelect={(item) => {
          if (item === searchFilters.species) return;

          // 종 변경 시 모프 초기화
          setSearchFilters({
            ...searchFilters,
            species: item,
            morphs: undefined,
            traits: undefined,
          });
        }}
      />
      {searchFilters.species && (
        <AdoptionMultiSelectFilter
          type="morphs"
          title="모프"
          displayMap={MORPH_LIST_BY_SPECIES[searchFilters.species]}
        />
      )}
      {searchFilters.species && (
        <AdoptionMultiSelectFilter
          type="traits"
          title="형질"
          displayMap={TRAIT_LIST_BY_SPECIES[searchFilters.species]}
        />
      )}
      <AdoptionMultiSelectFilter type="sex" title="성별" displayMap={GENDER_KOREAN_INFO} />
      <AdoptionMultiSelectFilter type="growth" title="크기" displayMap={GROWTH_KOREAN_INFO} />
      <SelectFilter
        showTitle
        type="adoptionStatus"
        initialItem={searchFilters.status}
        onSelect={(item) => {
          setSearchFilters({
            ...searchFilters,
            status: item,
          });
        }}
      />
      <AdoptionPriceRangeFilter />

      <button
        onClick={resetFilters}
        className="h-[32px] cursor-pointer rounded-lg px-3 text-sm text-blue-700 underline hover:bg-blue-100"
      >
        필터 리셋
      </button>
    </div>
  );
}
