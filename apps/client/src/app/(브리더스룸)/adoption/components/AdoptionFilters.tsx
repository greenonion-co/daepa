"use client";

import {
  MORPH_LIST_BY_SPECIES,
  TRAIT_LIST_BY_SPECIES,
  GROWTH_KOREAN_INFO,
  GENDER_KOREAN_INFO,
  ADOPTION_METHOD_KOREAN_INFO,
} from "../../constants";
import SelectFilter from "../../components/selector/SingleSelect";
import MultiSelect from "../../components/selector/MultiSelect";
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
        <MultiSelect
          title="모프"
          displayMap={MORPH_LIST_BY_SPECIES[searchFilters.species]}
          selected={searchFilters.morphs ?? []}
          onChange={(morphs) => setSearchFilters((prev) => ({ ...prev, morphs }))}
        />
      )}
      {searchFilters.species && (
        <MultiSelect
          title="형질"
          displayMap={TRAIT_LIST_BY_SPECIES[searchFilters.species]}
          selected={searchFilters.traits ?? []}
          onChange={(traits) => setSearchFilters((prev) => ({ ...prev, traits }))}
        />
      )}
      <MultiSelect
        title="성별"
        displayMap={GENDER_KOREAN_INFO}
        selected={searchFilters.sex ?? []}
        onChange={(sex) => setSearchFilters((prev) => ({ ...prev, sex: sex as typeof searchFilters.sex }))}
      />
      <MultiSelect
        title="크기"
        displayMap={GROWTH_KOREAN_INFO}
        selected={searchFilters.growth ?? []}
        onChange={(growth) => setSearchFilters((prev) => ({ ...prev, growth: growth as typeof searchFilters.growth }))}
      />
      <MultiSelect
        title="분양 방식"
        displayMap={ADOPTION_METHOD_KOREAN_INFO}
        selected={searchFilters.method ?? []}
        onChange={(method) => setSearchFilters((prev) => ({ ...prev, method: method as typeof searchFilters.method }))}
      />
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
