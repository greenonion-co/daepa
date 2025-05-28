import { cn } from "@/lib/utils";
import { UpdateUserNotificationDto, UserNotificationDtoStatus } from "@repo/api-client";
import { formatDistanceToNow } from "date-fns";
import { ExtendedUserNotificationDto, useNotiStore } from "../store/noti";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ko } from "date-fns/locale";
import { NOTIFICATION_TYPE } from "@/app/(브리더스룸)/constants";
import { Badge } from "@/components/ui/badge";

const NotiList = ({
  items,
  handleUpdate,
}: {
  items: ExtendedUserNotificationDto[];
  handleUpdate: (item: UpdateUserNotificationDto) => void;
}) => {
  const { selected, setSelected } = useNotiStore();

  const handleItemClick = (item: ExtendedUserNotificationDto) => {
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
        {items.map((item) => {
          const role = item.detailJson.receiverPet.sex === "M" ? "father" : "mother";

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
                    <div className="font-semibold">{item?.detailJson?.receiverPet?.name}</div>
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
                <div className="flex gap-2">
                  <span
                    className={cn(
                      "relative font-bold after:absolute after:bottom-1 after:left-0.5 after:-z-10 after:h-[10px] after:w-full after:opacity-40",
                      role === "mother" ? "after:bg-red-400" : "after:bg-[#247DFE]",
                    )}
                  >
                    {role === "mother" ? "모" : "부"}
                  </span>
                  <Badge variant="outline" className="text-xs font-medium">
                    {NOTIFICATION_TYPE[item.type as keyof typeof NOTIFICATION_TYPE]}
                  </Badge>
                </div>
              </div>
              {item?.detailJson?.message && (
                <div className="text-muted-foreground line-clamp-2 text-xs">
                  {item.detailJson.message.substring(0, 300)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default NotiList;
