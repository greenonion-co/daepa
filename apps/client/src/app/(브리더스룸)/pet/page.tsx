"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { columns } from "./components/columns";
import DataTable from "./components/DataTable";
import { brPetControllerFindAll, BrPetControllerFindAllFilterType } from "@repo/api-client";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

import Link from "next/link";
import Add from "@mui/icons-material/Add";
import { useFilterStore } from "../store/filter";
import { ScanFace } from "lucide-react";
import { Card } from "@/components/ui/card";
import Loading from "@/components/common/Loading";

export default function PetPage() {
  const { ref, inView } = useInView();
  const { searchFilters } = useFilterStore();
  const itemPerPage = 10;

  // 일반 목록 조회
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: [brPetControllerFindAll.name, searchFilters, BrPetControllerFindAllFilterType.MY],
    queryFn: ({ pageParam = 1 }) =>
      brPetControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "DESC",
        filterType: BrPetControllerFindAllFilterType.MY,
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

  if (isLoading) return <Loading />;

  return (
    <div className="container mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">펫 목록</h1>
        <div className="text-sm text-gray-600">검색 결과: {totalCount}개</div>
      </div>

      {items && items.length === 0 ? (
        <Link href="/register/1">
          <Card className="flex cursor-pointer flex-col items-center justify-center bg-blue-50 p-10 hover:bg-blue-100">
            <ScanFace className="h-10 w-10 text-blue-500" />
            <div className="text-center text-gray-600">
              나의 펫을
              <span className="text-blue-500">등록</span>하여
              <div className="font-semibold text-blue-500">브리더스룸을 시작해보세요!</div>
            </div>
          </Card>
        </Link>
      ) : (
        <DataTable
          columns={columns}
          data={items ?? []}
          hasMore={hasNextPage}
          isFetchingMore={isFetchingNextPage}
          loaderRefAction={ref}
        />
      )}

      <Link
        href="/register/1"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-lg hover:bg-blue-600"
      >
        <Add fontSize="large" className="text-white" />
      </Link>
    </div>
  );
}
