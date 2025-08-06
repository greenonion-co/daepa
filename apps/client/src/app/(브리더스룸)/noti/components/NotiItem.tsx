import {
  UpdateUserNotificationDto,
  userNotificationControllerFindAll,
  userNotificationControllerUpdate,
  UserNotificationDto,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { Badge } from "@/components/ui/badge";
import NotiTitle from "./NotiTitle";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { NOTIFICATION_TYPE } from "../../constants";
import { ParentRequestDetailJsonDto } from "../../register/types";
import StatusBadge from "./StatusBadge";

interface NotiItemProps {
  item: UserNotificationDto;
}

const NotiItem = ({ item }: NotiItemProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = Number(searchParams.get("id"));

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
    (item: UserNotificationDto) => {
      if (item.id) {
        router.push(`/noti?id=${item.id}`);
      }

      if (item.status === UserNotificationDtoStatus.UNREAD) {
        updateNotification({ id: item.id, status: UserNotificationDtoStatus.READ });
      }
    },
    [router, updateNotification],
  );

  useEffect(() => {
    if (selectedId) {
      const itemElement = document.getElementById(`noti-item-${selectedId}`);
      if (itemElement) {
        itemElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [selectedId]);

  return (
    <button
      key={item.id}
      id={`noti-item-${item.id}`}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md",
        item.id === selectedId && "bg-blue-200 dark:bg-gray-800",
      )}
      onClick={() => handleItemClick(item)}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <Badge
              className={cn("my-1 px-2 text-sm font-semibold", NOTIFICATION_TYPE[item.type].color)}
            >
              {NOTIFICATION_TYPE[item.type].label}
            </Badge>
            <StatusBadge item={item} />

            {item.status === UserNotificationDtoStatus.UNREAD && (
              <span className="flex h-2 w-2 rounded-full bg-red-500" />
            )}
          </div>
          <div
            className={cn(
              "ml-auto text-xs",
              item.id === selectedId ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {formatDistanceToNow(new Date(item.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </div>
        </div>
        <NotiTitle detailData={item?.detailJson as unknown as ParentRequestDetailJsonDto} />
      </div>
      <div className="text-muted-foreground line-clamp-2 text-xs">
        {(item.detailJson?.message as string)?.substring(0, 300)}
      </div>
    </button>
  );
};

export default NotiItem;
