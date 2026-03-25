"use client";

import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { columns } from "./columns";
import DataTable from "./DataTable";
import PetCardList from "./PetCardList";
import ViewModeToggle from "./ViewModeToggle";
import { brPetControllerFindAll } from "@repo/api-client";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/hooks/useAppRouter";
import { toast } from "@/lib/toast";
import { RefreshCcw, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

import { useFilterStore } from "../../store/filter";
import { useSearchKeywordStore } from "../../store/searchKeyword";
import { useViewMode } from "../../store/viewMode";

import Loading from "@/components/common/Loading";
import { Filters } from "./Filters";
import ExportToolbar from "./ExportToolbar";
import useTableStore from "../store/table";

export default function PetList() {
  const { ref, inView } = useInView();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { searchFilters } = useFilterStore();
  const { searchKeyword } = useSearchKeywordStore();
  const { viewMode } = useViewMode();
  const { isExportMode, setExportMode } = useTableStore();
  const searchParams = useSearchParams();
  const router = useAppRouter();
  const itemPerPage = 10;

  // 404 에러 처리 (개체를 찾을 수 없는 경우)
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "pet-not-found") {
      toast.error("개체를 찾을 수 없습니다");
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
      placeholderData: keepPreviousData,
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
    <div className="dark:bg-background min-h-screen space-y-1">
      <div className="dark:bg-background sticky top-[52px] z-20 bg-white px-2 pt-2 pb-1">
        <Filters variant="default" />
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
          보유 개체・{totalCount}마리
          <RefreshCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </button>

        <div className="flex items-center gap-2">
          {!isExportMode && (
            <button
              type="button"
              onClick={() => setExportMode(true)}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 p-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <FileSpreadsheet className="h-4 w-4" />
              라벨링 목록 추출
            </button>
          )}
          {/*<Link*/}
          {/*  href="/pet/deleted"*/}
          {/*  className="cursor-pointer rounded-lg px-2 py-1 text-xs text-red-600 underline hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"*/}
          {/*>*/}
          {/*  삭제된 개체 보기*/}
          {/*</Link>*/}
          <ViewModeToggle />
        </div>
      </div>

      {/* 추출 모드 툴바 */}
      {isExportMode && (
        <div className="px-2">
          <ExportToolbar data={items ?? []} onClose={() => setExportMode(false)} />
        </div>
      )}

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
