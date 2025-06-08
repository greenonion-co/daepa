import { cn } from "@/lib/utils";
import {
  UpdateUserNotificationDto,
  userNotificationControllerFindAll,
  userNotificationControllerUpdate,
  UserNotificationDto,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { formatDistanceToNow } from "date-fns";
import { useNotiStore } from "../store/noti";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ko } from "date-fns/locale";
import { NOTIFICATION_TYPE } from "@/app/(브리더스룸)/constants";
import Loading from "@/components/common/Loading";
import NotiTitle from "./NotiTitle";
import { PetSummaryDto } from "@/types/pet";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

const NotiList = ({ tab }: { tab: "all" | "unread" }) => {
  const [items, setItems] = useState<UserNotificationDto[]>([]);

  const { selected, setSelected } = useNotiStore();
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

  const { mutate: updateNotification } = useMutation({
    mutationFn: (data: UpdateUserNotificationDto) => userNotificationControllerUpdate(data),
    onMutate: async (newData) => {
      // 낙관적 업데이트
      setItems((prev) =>
        prev.map((item) =>
          item.id === newData.id ? { ...item, status: UserNotificationDtoStatus.read } : item,
        ),
      );
    },
    onError: () => {
      // 에러 시 원래 상태로 복구
      setItems(items);
    },
  });

  const handleItemClick = (item: UserNotificationDto) => {
    setSelected(item);
    // NOTE: 테스트 코드
    // return handleUpdate({ id: item.id, status: UserNotificationDtoStatus.read });

    if (item.status === UserNotificationDtoStatus.unread) {
      updateNotification({ id: item.id, status: UserNotificationDtoStatus.read });
    }
  };

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
          ?.filter((item) => item.status === UserNotificationDtoStatus.unread) ?? [],
      );
    }
  }, [data?.pages, tab]);

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {/* 역할별 색상 안내 추가 */}
        <div className="text-muted-foreground mb-2 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400/70" />
            <span>모</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#247DFE]/70" />
            <span>부</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-muted-foreground/50 h-2 w-2 rounded-full" />
            <span>미구분</span>
          </div>
        </div>

        {items.map((item) => {
          return (
            <button
              key={item.id}
              className={cn(
                "hover:bg-accent flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md",
                selected?.id === item.id && "bg-blue-50",
              )}
              onClick={() => handleItemClick(item)}
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">
                      {NOTIFICATION_TYPE[item.type as keyof typeof NOTIFICATION_TYPE]}
                    </div>
                    {item.status === UserNotificationDtoStatus.unread && (
                      <span className="flex h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "ml-auto text-xs",
                      selected?.id === item.id ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </div>
                </div>
                <NotiTitle
                  receiverPet={item?.detailJson?.receiverPet as PetSummaryDto}
                  senderPet={item?.detailJson?.senderPet as PetSummaryDto}
                />
              </div>
              <div className="text-muted-foreground line-clamp-2 text-xs">
                {(item.detailJson?.message as string)?.substring(0, 300)}
              </div>
            </button>
          );
        })}

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
