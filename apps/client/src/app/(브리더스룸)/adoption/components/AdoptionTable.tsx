import { useEffect, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import Loading from "@/components/common/Loading";
import AdoptionCardList from "./AdoptionCardList";
import AdoptionTableView from "./AdoptionTableView";
import { useInView } from "react-intersection-observer";
import { useAdoptionFilterStore } from "../../store/adoptionFilter";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AdoptionFilters } from "./AdoptionFilters";
import { adoptionHistoryControllerGetAllAdoptions } from "@repo/api-client";
import ViewModeToggle from "../../pet/components/ViewModeToggle";
import { useViewMode } from "../../store/viewMode";

const AdoptionTable = () => {
  const { ref, inView } = useInView();
  const { searchFilters } = useAdoptionFilterStore();
  const itemPerPage = 10;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { viewMode } = useViewMode("adoption");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: [adoptionHistoryControllerGetAllAdoptions.name, searchFilters],
      queryFn: ({ pageParam = 1 }) =>
        adoptionHistoryControllerGetAllAdoptions({
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
      select: (data) => data.pages.flatMap((page) => page.data.data),
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (isLoading) return <Loading />;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 pb-1 pl-2 pr-2">
        <div className="flex items-center gap-2">
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
            className="flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-gray-600 hover:bg-blue-100 hover:text-blue-700"
          >
            분양 정보 ・{data?.length ?? "?"}개
            <RefreshCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
          </button>
          <span className="text-[11px] text-blue-600">분양 완료된 개체만 표시됩니다</span>
        </div>
        <ViewModeToggle viewModeKey="adoption" />
      </div>

      <AdoptionFilters />

      {viewMode === "card" ? (
        <AdoptionCardList
          data={data ?? []}
          hasMore={hasNextPage}
          isFetchingMore={isFetchingNextPage}
          loaderRefAction={ref}
          isEmpty={!data?.length}
        />
      ) : (
        <AdoptionTableView
          data={data ?? []}
          hasMore={hasNextPage}
          isFetchingMore={isFetchingNextPage}
          loaderRefAction={ref}
        />
      )}
    </div>
  );
};

export default AdoptionTable;
