import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotiStore } from "../store/noti";
import { useMutation } from "@tanstack/react-query";
import { parentControllerUpdateParentStatus, UpdateParentDto } from "@repo/api-client";

// WARNING: 추후에 server type 으로 교체
export type PARENT_STATUS = "pending" | "approved" | "rejected" | "deleted" | "cancelled";

export function NotiDisplay() {
  const { selected: item } = useNotiStore();

  const { mutate: updateParentStatus } = useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: UpdateParentDto }) =>
      parentControllerUpdateParentStatus(petId, data),
  });

  const handleUpdate = (status: PARENT_STATUS) => {
    if (!item?.targetId) return;
    updateParentStatus({
      petId: item.targetId,
      data: { parentId: item.targetId, updateStatus: status },
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!item}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>삭제</TooltipContent>
        </Tooltip>

        {item?.type === "PARENT_REQUEST" && (
          <form>
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleUpdate("rejected");
                  }}
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                >
                  요청 거절
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleUpdate("approved");
                  }}
                  size="sm"
                  className="ml-auto"
                >
                  요청 수락
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
      <Separator />
      {item ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage alt="보내는 사람" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">보내는 사람</div>
                <div className="line-clamp-1 text-xs">{item.targetId}</div>
              </div>
            </div>
            {item.createdAt && (
              <div className="text-muted-foreground ml-auto text-xs">
                {format(new Date(item.createdAt), "PPP EE p", { locale: ko })}
                {item.updatedAt !== item.createdAt && (
                  <div className="flex items-center gap-1">
                    {formatDistanceToNow(new Date(item.updatedAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                    <span className="text-muted-foreground">수정됨</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <Separator />
          <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
            {(item.detailJson as { message: string }).message}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground p-8 text-center">알림을 선택해주세요. </div>
      )}
    </div>
  );
}

export default NotiDisplay;
