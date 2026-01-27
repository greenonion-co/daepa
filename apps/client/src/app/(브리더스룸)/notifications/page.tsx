"use client";

import { userNotificationControllerFindAll } from "@repo/api-client";
import { ScrollArea } from "@/components/ui/scroll-area";

import Loading from "@/components/common/Loading";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "next/navigation";

import { useInfiniteQuery } from "@tanstack/react-query";
import NotificationItem from "./components/NotificationItem";
import LoadingScreen from "@/app/loading";

const NotificationsPage = () => {
  const { ref, inView } = useInView();
  const searchParams = useSearchParams();
  const targetNotificationId = searchParams.get("id");

  const {
    data = [],
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [userNotificationControllerFindAll.name],
    queryFn: ({ pageParam = 1 }) =>
      userNotificationControllerFindAll({
        page: pageParam,
        itemPerPage: 10,
        order: "DESC",
      }),
    enabled: true,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
    select: (response) => response.pages.flatMap((page) => page.data.data),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <LoadingScreen />;

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">알림이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <ScrollArea className={"h-full w-full max-w-[500px] py-2"}>
        <div className="flex flex-col items-center gap-2 pt-0">
          <div className="flex w-full flex-col gap-2">
            {data.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                defaultOpen={targetNotificationId === String(item.id)}
              />
            ))}
          </div>

          {/* 무한 스크롤 로더 */}
          {hasNextPage && (
            <div ref={ref} className="h-20 text-center">
              {isFetchingNextPage && <Loading />}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NotificationsPage;
