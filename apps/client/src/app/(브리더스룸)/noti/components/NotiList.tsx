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
import Loading from "@/components/common/Loading";
import NotiTitle from "./NotiTitle";
import { PetSummaryDto } from "@/types/pet";

interface NotiListProps {
  items: UserNotificationDto[];
  handleUpdate: (item: UpdateUserNotificationDto) => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  loaderRefAction: (node?: Element | null) => void;
}

const NotiList = ({
  items,
  handleUpdate,
  hasMore,
  isFetchingMore,
  loaderRefAction,
}: NotiListProps) => {
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
        {hasMore && (
          <div ref={loaderRefAction} className="h-20 text-center">
            {isFetchingMore ? (
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
