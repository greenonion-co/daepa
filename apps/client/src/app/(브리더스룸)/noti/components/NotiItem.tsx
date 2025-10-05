import {
  ParentLinkDetailJson,
  UserNotificationDto,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { Badge } from "@/components/ui/badge";
import NotiTitle from "./NotiTitle";
import { castDetailJson, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useCallback, useEffect } from "react";
import { NOTIFICATION_TYPE } from "../../constants";
import StatusBadge from "./StatusBadge";
import useUserNotificationStore from "../../store/userNotification";
import { useNotificationRead } from "@/hooks/useNotificationRead";

interface NotiItemProps {
  item: UserNotificationDto;
}

const NotiItem = ({ item }: NotiItemProps) => {
  const detailJson = castDetailJson<ParentLinkDetailJson>(item.type, item?.detailJson);

  const { notification } = useUserNotificationStore();
  const selectedNotificationId = notification?.id;
  const { setNotificationRead } = useNotificationRead();

  const { setNotification } = useUserNotificationStore();

  const handleItemClick = useCallback(
    async (item: UserNotificationDto) => {
      if (!item) return;

      setNotification(item);

      try {
        await setNotificationRead(item);
      } catch (error) {
        console.error(error);
      }
    },
    [setNotification, setNotificationRead],
  );

  useEffect(() => {
    if (selectedNotificationId) {
      const itemElement = document.getElementById(`noti-item-${selectedNotificationId}`);
      if (itemElement) {
        itemElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [selectedNotificationId]);

  return (
    <button
      key={item.id}
      id={`noti-item-${item.id}`}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md",
        item.id === selectedNotificationId && "bg-blue-200 dark:bg-gray-800",
      )}
      onClick={() => {
        handleItemClick(item);
      }}
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
              item.id === notification?.id ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {formatDistanceToNow(new Date(item.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </div>
        </div>
        <NotiTitle
          href={detailJson?.parentPet?.id ? `/pet/${detailJson.parentPet.id}` : undefined}
          displayText={detailJson?.childPet?.name ?? ""}
          label={detailJson?.parentPet?.name}
        />
      </div>
      <div className="text-muted-foreground line-clamp-2 text-xs">
        {detailJson?.message?.substring(0, 300)}
      </div>
    </button>
  );
};

export default NotiItem;
