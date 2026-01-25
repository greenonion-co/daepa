"use client";

import { useRef, useLayoutEffect, useState } from "react";
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
  variant?: "default" | "light";
}

export function Filters({ showPublicFilter = true, variant = "default" }: FiltersProps) {
  const isLight = variant === "light";
  const { searchFilters, setSearchFilters, resetFilters } = useFilterStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const allBtnRef = useRef<HTMLButtonElement>(null);
  const publicBtnRef = useRef<HTMLButtonElement>(null);
  const privateBtnRef = useRef<HTMLButtonElement>(null);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    let activeBtn: HTMLButtonElement | null = null;

    if (searchFilters.isPublic === undefined) {
      activeBtn = allBtnRef.current;
    } else if (searchFilters.isPublic === 1) {
      activeBtn = publicBtnRef.current;
    } else {
      activeBtn = privateBtnRef.current;
    }

    if (container && activeBtn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [searchFilters.isPublic]);

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {showPublicFilter && (
        <div
          ref={containerRef}
          className={cn(
            "relative flex h-[32px] items-center gap-2 rounded-lg px-0.5",
            isLight ? "bg-white shadow-sm dark:bg-[#18171C]" : "bg-gray-100 dark:bg-gray-800",
          )}
        >
          {/* 애니메이션 인디케이터 */}
          <div
            className={cn(
              "absolute rounded-lg shadow-sm transition-all duration-200 ease-out",
              isLight ? "bg-gray-100 dark:bg-[#101012]" : "bg-white dark:bg-gray-700",
            )}
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              height: "calc(100% - 4px)",
              top: "2px",
            }}
          />
          <button
            ref={allBtnRef}
            onClick={() => setSearchFilters({ ...searchFilters, isPublic: undefined })}
            className={cn(
              "relative z-10 cursor-pointer rounded-md px-2 py-0.5 text-sm font-semibold transition-colors duration-200",
              searchFilters.isPublic === undefined
                ? "text-gray-800 dark:text-gray-200"
                : "text-gray-600 dark:text-gray-400",
            )}
          >
            전체
          </button>
          <button
            ref={publicBtnRef}
            onClick={() => setSearchFilters({ ...searchFilters, isPublic: 1 })}
            className={cn(
              "relative z-10 cursor-pointer rounded-md px-2 py-0.5 text-sm font-semibold transition-colors duration-200",
              searchFilters.isPublic === 1
                ? "text-gray-800 dark:text-gray-200"
                : "text-gray-600 dark:text-gray-400",
            )}
          >
            공개
          </button>
          <button
            ref={privateBtnRef}
            onClick={() => setSearchFilters({ ...searchFilters, isPublic: 0 })}
            className={cn(
              "relative z-10 cursor-pointer rounded-md px-2 py-0.5 text-sm font-semibold transition-colors duration-200",
              searchFilters.isPublic === 0
                ? "text-gray-800 dark:text-gray-200"
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
        variant={variant}
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
            variant={variant}
          />
          <MultiSelectFilter
            type="traits"
            title="형질"
            displayMap={TRAIT_LIST_BY_SPECIES[searchFilters.species]}
            variant={variant}
          />
        </>
      )}
      <MultiSelectFilter
        type="growth"
        title="크기"
        displayMap={GROWTH_KOREAN_INFO}
        variant={variant}
      />
      <MultiSelectFilter
        type="sex"
        title="성별"
        displayMap={GENDER_KOREAN_INFO}
        variant={variant}
      />
      <MultiSelectFilter
        type="status"
        title="분양상태"
        displayMap={SALE_STATUS_KOREAN_INFO}
        variant={variant}
      />
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
