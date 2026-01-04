"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

import { columns } from "./components/columns";
import DataTable from "./components/DataTable";
import Loading from "@/components/common/Loading";
import { petControllerGetDeletedPets } from "@repo/api-client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function DeletedPetsPage() {
  const { ref, inView } = useInView();
  const itemPerPage = 10;

  const { data, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: [petControllerGetDeletedPets.name],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await petControllerGetDeletedPets({
          page: pageParam,
          itemPerPage,
          order: "DESC",
        });
        return response.data;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.meta.hasNextPage) {
          return lastPage.meta.page + 1;
        }
        return undefined;
      },
      select: (resp) => ({
        items: resp.pages.flatMap((p) => p.data),
        totalCount: resp.pages[0]?.meta.totalCount ?? 0,
      }),
    });

  const { items, totalCount } = data ?? {};

  // 무한 스크롤 처리
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <Loading />;

  const isEmpty = items && items.length === 0;

  return (
    <div className="space-y-4 px-2">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-[16px] text-gray-900 dark:text-blue-200">삭제된 펫 목록</h1>
        </div>

        <Alert
          className="text-blue-700 dark:text-blue-500"
          style={{
            background:
              "linear-gradient(90deg, rgba(182, 210, 247, .25), rgba(245, 223, 255, .25))",
          }}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>펫 복구 안내</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-500">
            삭제된 펫을 복구하시려면 운영자에게 문의해주세요.
            <br />
            삭제된 펫 정보는 보관되며, 운영자 승인 후 복구가 가능합니다.
          </AlertDescription>
        </Alert>
      </div>

      {isEmpty ? (
        <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
          <div className="font-semibold">삭제된 펫이 없습니다</div>
          <div className="mt-1 text-sm">삭제한 펫이 있으면 여기에 표시됩니다</div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items ?? []}
          totalCount={totalCount}
          hasMore={hasNextPage}
          isFetchingMore={isFetchingNextPage}
          loaderRefAction={ref}
          refetch={refetch}
        />
      )}
    </div>
  );
}
