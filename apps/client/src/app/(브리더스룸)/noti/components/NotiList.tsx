import { cn } from "@/lib/utils";
import {
  EggDto,
  PetDto,
  PetSummaryDto,
  UpdateUserNotificationDto,
  userNotificationControllerFindAll,
  userNotificationControllerUpdate,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { formatDistanceToNow } from "date-fns";
import { NotificationDetail, useNotiStore } from "../store/noti";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ko } from "date-fns/locale";
import { NOTIFICATION_TYPE } from "@/app/(브리더스룸)/constants";
import Loading from "@/components/common/Loading";
import NotiTitle from "./NotiTitle";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const NotiList = ({ tab }: { tab: "all" | "unread" }) => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<NotificationDetail[]>([]);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userNotificationControllerFindAll.name] });
    },
    onError: () => {
      toast.error("알림 읽음 처리에 실패했습니다.");
    },
  });

  const handleItemClick = useCallback(
    (item: NotificationDetail) => {
      if (item.id) {
        router.push(`/noti?id=${item.id}`);
      }
      setSelected(item);

      if (item.status === UserNotificationDtoStatus.UNREAD) {
        updateNotification({ id: item.id, status: UserNotificationDtoStatus.READ });
      }
    },
    [router, setSelected, updateNotification],
  );

  useEffect(() => {
    const id = searchParams.get("id");
    const item = items.find((item) => item.id === Number(id));
    if (item) {
      setSelected(item);
      setTimeout(() => {
        selectedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      setSelected(null);
    }
  }, [searchParams, items, selected, setSelected]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (!data?.pages) return;
    if (tab === "all") {
      setItems(data?.pages.flatMap((page) => page.data.data as NotificationDetail[]) ?? []);
    } else {
      setItems(
        data?.pages
          .flatMap((page) => page.data.data as NotificationDetail[])
          ?.filter((item) => item.status === UserNotificationDtoStatus.UNREAD) ?? [],
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

        {items.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">알림이 없습니다.</p>
          </div>
        )}

        {items.map((item) => {
          return (
            <button
              key={item.id}
              ref={selected?.id === item.id ? selectedRef : null}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md",
                selected?.id === item.id && "bg-blue-200 dark:bg-gray-800",
              )}
              onClick={() => handleItemClick(item)}
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "my-1 px-2 text-sm font-semibold",
                        NOTIFICATION_TYPE[item.type as keyof typeof NOTIFICATION_TYPE].color,
                      )}
                    >
                      {NOTIFICATION_TYPE[item.type as keyof typeof NOTIFICATION_TYPE].label}
                    </Badge>
                    {item.status === UserNotificationDtoStatus.UNREAD && (
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
                  receiverPet={item?.detailJson?.receiverPet as PetDto | PetSummaryDto | EggDto}
                  senderPet={item?.detailJson?.senderPet as PetDto | PetSummaryDto | EggDto}
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
