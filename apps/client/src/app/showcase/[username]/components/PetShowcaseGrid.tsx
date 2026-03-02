"use client";

import { useCallback, useEffect, useRef } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { petControllerFindAll, PetDto } from "@repo/api-client";
import Loading from "@/components/common/Loading";
import PetShowcaseCard from "./PetShowcaseCard";
import type { ShowcaseFilters } from "./ShowcaseFilterBar";

const ITEMS_PER_PAGE = 20;

interface PetShowcaseGridProps {
  userId: string;
  filters: ShowcaseFilters;
}

export default function PetShowcaseGrid({
  userId,
  filters,
}: PetShowcaseGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, isLoading } = useInfiniteQuery({
    queryKey: [
      "showcase-pets",
      userId,
      filters.sex,
      filters.status,
      filters.growth,
      filters.morphs,
      filters.traits,
      filters.search,
      filters.sort,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await petControllerFindAll({
        page: pageParam,
        itemPerPage: ITEMS_PER_PAGE,
        order: filters.sort as "ASC" | "DESC",
        ownerId: userId,
        ...(filters.search ? { keyword: filters.search } : {}),
        ...(filters.sex.length > 0 ? { sex: filters.sex as any } : {}),
        ...(filters.status.length > 0 ? { status: filters.status as any } : {}),
        ...(filters.growth.length > 0 ? { growth: filters.growth as any } : {}),
        ...(filters.morphs.length > 0 ? { morphs: filters.morphs as any } : {}),
        ...(filters.traits.length > 0 ? { traits: filters.traits as any } : {}),
      });
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
    select: (resp) => ({
      items: resp.pages.flatMap((p) => p.data.data) as PetDto[],
      totalCount: resp.pages[0]?.data.meta.totalCount ?? 0,
    }),
    placeholderData: keepPreviousData,
  });

  const { items: pets = [], totalCount = 0 } = data ?? {};

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "200px",
    });

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (pets.length === 0) {
    const hasFilters =
      filters.sex.length > 0 ||
      filters.status.length > 0 ||
      filters.growth.length > 0 ||
      filters.morphs.length > 0 ||
      filters.traits.length > 0 ||
      filters.search;
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {hasFilters ? "조건에 맞는 개체가 없습니다" : "등록된 개체가 없습니다"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* 개수 표시 */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <span>{`${totalCount}마리`}</span>
        {isFetching && !isFetchingNextPage && (
          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* 그리드 */}
      <div className="grid grid-cols-2 gap-2 min-[1800px]:grid-cols-7 min-[2100px]:grid-cols-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {pets.map((pet) => (
          <PetShowcaseCard key={pet.petId} pet={pet} />
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Loading />}
        {!hasNextPage && pets.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">모든 개체를 불러왔습니다</p>
        )}
      </div>
    </div>
  );
}
