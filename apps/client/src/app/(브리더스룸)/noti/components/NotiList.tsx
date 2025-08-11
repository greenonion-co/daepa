import {
  userNotificationControllerFindAll,
  UserNotificationDto,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { ScrollArea } from "@/components/ui/scroll-area";

import Loading from "@/components/common/Loading";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import NotiItem from "./NotiItem";

const NotiList = ({ tab }: { tab: "all" | "unread" }) => {
  const [items, setItems] = useState<UserNotificationDto[]>([]);
  const { ref, inView } = useInView();

  const itemPerPage = 10;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [userNotificationControllerFindAll.name, itemPerPage],
    queryFn: ({ pageParam = 1 }) =>
      userNotificationControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "DESC",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (!data?.pages) return;
    if (tab === "all") {
      setItems(data?.pages.flatMap((page) => page.data.data) ?? []);
    } else {
      setItems(
        data?.pages
          .flatMap((page) => page.data.data)
          ?.filter((item) => item.status === UserNotificationDtoStatus.UNREAD) ?? [],
      );
    }
  }, [data?.pages, tab]);

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">알림이 없습니다.</p>
          </div>
        )}

        {items.map((item) => (
          <NotiItem key={item.id} item={item} />
        ))}

        {/* 무한 스크롤 로더 */}
        {hasNextPage && (
          <div ref={ref} className="h-20 text-center">
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" />
              </div>
            ) : (
              <Loading />
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default NotiList;
