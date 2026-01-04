"use client";

import {
  MORPH_LIST_BY_SPECIES,
  TRAIT_LIST_BY_SPECIES,
  GROWTH_KOREAN_INFO,
  GENDER_KOREAN_INFO,
} from "../../constants";
import SelectFilter from "../../components/selector/SingleSelect";
import AdoptionMultiSelectFilter from "./AdoptionMultiSelectFilter";
import { useAdoptionFilterStore } from "../../store/adoptionFilter";
import AdoptionPriceRangeFilter from "./AdoptionPriceRangeFilter";
import AdoptionDateRangeFilter from "./AdoptionDateRangeFilter";
import FilterItem from "./FilterItem";
import { overlay } from "overlay-kit";
import ParentSearchSelector from "../../components/selector/parentSearch";
import { PetDtoSex } from "@repo/api-client";

export function AdoptionFilters() {
  const { searchFilters, setSearchFilters, resetFilters, father, mother, setFather, setMother } =
    useAdoptionFilterStore();

  const openParentSearchSelector = (sex: PetDtoSex) =>
    overlay.open(({ isOpen, close, unmount }) => (
      <ParentSearchSelector
        isOpen={isOpen}
        onClose={close}
        onSelect={(item) => {
          close();
          if (sex === PetDtoSex.MALE) {
            setFather(item);
          } else {
            setMother(item);
          }
        }}
        sex={sex}
        onExit={unmount}
        onlySelect
        species={searchFilters.species ?? undefined}
      />
    ));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 px-2">
      <SelectFilter
        showSelectAll
        showTitle
        type="species"
        saveASAP
        initialItem={searchFilters.species}
        onSelect={(item) => {
          if (item === searchFilters.species) return;

          // 종 변경 시 모프, 부모 초기화
          setSearchFilters({
            ...searchFilters,
            species: item,
            morphs: undefined,
            traits: undefined,
          });
          setFather(null);
          setMother(null);
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
      <AdoptionPriceRangeFilter />
      <AdoptionDateRangeFilter />

      <FilterItem
        value={father?.name}
        placeholder="부 개체"
        title="부"
        onClose={() => {
          setFather(null);
        }}
        onClick={() => {
          openParentSearchSelector(PetDtoSex.MALE);
        }}
      />

      <FilterItem
        value={mother?.name}
        placeholder="모 개체"
        title="모"
        onClose={() => {
          setMother(null);
        }}
        onClick={() => {
          openParentSearchSelector(PetDtoSex.FEMALE);
        }}
      />

      <button
        onClick={resetFilters}
        className="h-[32px] cursor-pointer rounded-lg px-3 text-sm text-blue-700 underline hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
      >
        필터 리셋
      </button>
    </div>
  );
}
