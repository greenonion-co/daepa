"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { columns } from "./components/columns";
import DataTable from "./components/DataTable";
import { brPetControllerFindAll } from "@repo/api-client";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo } from "react";

import { useFilterStore } from "../store/filter";
import { useSearchKeywordStore } from "../store/searchKeyword";

import Loading from "@/components/common/Loading";

export default function PetPage() {
  const { ref, inView } = useInView();
  const { searchFilters } = useFilterStore();
  const { searchKeyword } = useSearchKeywordStore();
  const itemPerPage = 10;

  // 일반 목록 조회
  const { data, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: [brPetControllerFindAll.name, searchFilters, searchKeyword],
      queryFn: ({ pageParam = 1 }) =>
        brPetControllerFindAll({
          page: pageParam,
          itemPerPage,
          order: "DESC",
          ...searchFilters,
          keyword: searchKeyword,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.data.meta.hasNextPage) {
          return lastPage.data.meta.page + 1;
        }
        return undefined;
      },
      select: (resp) => ({
        items: resp.pages.flatMap((p) => p.data.data),
        totalCount: resp.pages[0]?.data.meta.totalCount ?? 0,
      }),
    });

  const { items, totalCount } = data ?? {};

  const isEmpty = useMemo(
    () =>
      items?.length === 0 &&
      Object.keys(searchFilters).filter((key) => {
        if (key === "species") return false;
        const value = searchFilters[key as keyof typeof searchFilters];
        // 배열: 길이 확인, 숫자: undefined/null 체크, 문자열: trim 후 체크
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "number") return value !== undefined && value !== null;
        return !!value?.toString?.().trim?.();
      }).length === 0 &&
      !searchKeyword?.trim(),
    [items?.length, searchFilters, searchKeyword],
  );

  // 무한 스크롤 처리
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={items ?? []}
        totalCount={totalCount}
        hasMore={hasNextPage}
        isFetchingMore={isFetchingNextPage}
        loaderRefAction={ref}
        refetch={refetch}
        isEmpty={isEmpty}
      />
    </div>
  );
}
