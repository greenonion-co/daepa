import { cn } from "@/lib/utils";
import {
  UpdateUserNotificationDto,
  UserNotificationDto,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { formatDistanceToNow } from "date-fns";
import { useNotiStore } from "../store/noti";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ko } from "date-fns/locale";
import { NOTIFICATION_TYPE } from "@/app/(브리더스룸)/constants";

const NotiList = ({
  items,
  handleUpdate,
}: {
  items: UserNotificationDto[];
  handleUpdate: (item: UpdateUserNotificationDto) => void;
}) => {
  const { selected, setSelected } = useNotiStore();

  const handleItemClick = (item: UserNotificationDto) => {
    setSelected(item);
    // NOTE: 테스트 코드
    // return handleUpdate({ id: item.id, status: UserNotificationDtoStatus.read });

    if (item.status === UserNotificationDtoStatus.unread) {
      handleUpdate({ id: item.id, status: UserNotificationDtoStatus.read });
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              "hover:bg-accent flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
              selected?.id === item.id && "bg-muted",
            )}
            onClick={() => handleItemClick(item)}
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">To. {item.detailJson.targetPet.name}</div>
                  {item.status === UserNotificationDtoStatus.unread && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600" />
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
              <div className="text-xs font-medium">
                {NOTIFICATION_TYPE[item.type as keyof typeof NOTIFICATION_TYPE]}
              </div>
            </div>
            {(item.detailJson as { message: string })?.message && (
              <div className="text-muted-foreground line-clamp-2 text-xs">
                {(item.detailJson as { message: string }).message.substring(0, 300)}
              </div>
            )}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default NotiList;
