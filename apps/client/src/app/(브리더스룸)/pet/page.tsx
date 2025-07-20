"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { columns } from "./components/columns";
import DataTable from "./components/DataTable";
import { brPetControllerFindAll } from "@repo/api-client";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

import useSearchStore from "./store/search";

export default function PetPage() {
  const { ref, inView } = useInView();
  const { searchFilters } = useSearchStore();
  const itemPerPage = 10;

  // 일반 목록 조회
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [brPetControllerFindAll.name, searchFilters],
    queryFn: ({ pageParam = 1 }) =>
      brPetControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "DESC",
        ...searchFilters,
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

  const { items, totalCount } = data ?? { items: [], totalCount: 0 };

  // 무한 스크롤 처리
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="container mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">펫 목록</h1>
        <div className="text-sm text-gray-600">검색 결과: {totalCount}개</div>
      </div>

      <DataTable
        columns={columns}
        data={items ?? []}
        hasMore={hasNextPage}
        isFetchingMore={isFetchingNextPage}
        loaderRefAction={ref}
      />
    </div>
  );
}
