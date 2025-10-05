import { UserNotificationDto } from "@repo/api-client";
import { ScrollArea } from "@/components/ui/scroll-area";

import Loading from "@/components/common/Loading";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import NotiItem from "./NotiItem";

const NotiList = ({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  items: UserNotificationDto[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) => {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

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
