"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { columns } from "./columns";
import DataTable from "./DataTable";
import PetCardList from "./PetCardList";
import ViewModeToggle from "./ViewModeToggle";
import { brPetControllerFindAll } from "@repo/api-client";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

import { useFilterStore } from "../../store/filter";
import { useSearchKeywordStore } from "../../store/searchKeyword";
import { useViewModeStore } from "../../store/viewMode";

import Loading from "@/components/common/Loading";
import { Filters } from "./Filters";

export default function PetList() {
  const { ref, inView } = useInView();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { searchFilters } = useFilterStore();
  const { searchKeyword } = useSearchKeywordStore();
  const { viewMode } = useViewModeStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const itemPerPage = 10;

  // 404 에러 처리 (펫을 찾을 수 없는 경우)
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "pet-not-found") {
      toast.error("펫을 찾을 수 없습니다");
      router.replace("/pet");
    }
  }, [searchParams, router]);

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

  // 타임아웃 cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen space-y-1 bg-gray-100 pt-2 dark:bg-transparent">
      <div className="px-2">
        <Filters variant="light" />
      </div>

      {/* 헤더: 검색 결과 + 삭제된 펫 보기 */}
      <div className="flex justify-between pr-1">
        <button
          type="button"
          aria-label="검색 결과 새로고침"
          aria-busy={isRefreshing}
          disabled={isRefreshing}
          onClick={async () => {
            if (isRefreshing) return;
            setIsRefreshing(true);
            try {
              await refetch();
            } finally {
              timeoutRef.current = setTimeout(() => setIsRefreshing(false), 500);
            }
          }}
          className="flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-gray-600 hover:bg-blue-100 hover:text-blue-700 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
        >
          검색된 펫・{totalCount}마리
          <RefreshCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </button>

        <div className="flex items-center gap-2">
          <Link
            href="/pet/deleted"
            className="cursor-pointer rounded-lg px-2 py-1 text-xs text-red-600 underline hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            삭제된 펫 보기
          </Link>
          <ViewModeToggle />
        </div>
      </div>

      {/* 뷰 모드에 따른 렌더링 */}
      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={items ?? []}
          hasMore={hasNextPage}
          isFetchingMore={isFetchingNextPage}
          loaderRefAction={ref}
          isEmpty={isEmpty}
        />
      ) : (
        <PetCardList
          data={items ?? []}
          hasMore={hasNextPage}
          isFetchingMore={isFetchingNextPage}
          loaderRefAction={ref}
          isEmpty={isEmpty}
        />
      )}
    </div>
  );
}
