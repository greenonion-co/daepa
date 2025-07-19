import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotiStore } from "../store/noti";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  parentControllerUpdateParentRequest,
  UpdateParentDto,
  UpdateParentDtoStatus,
  userNotificationControllerDelete,
  userNotificationControllerFindAll,
  UserNotificationDtoType,
} from "@repo/api-client";
import Link from "next/link";
import { toast } from "sonner";
import { NOTIFICATION_TYPE } from "../../constants";
import { Badge } from "@/components/ui/badge";
import NotiTitle from "./NotiTitle";
import { cn, formatDateToYYYYMMDDString } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function NotiDisplay() {
  const router = useRouter();
  const { selected: item, setSelected } = useNotiStore();
  const queryClient = useQueryClient();
  const receiverPet = item?.detailJson?.receiverPet;
  const senderPet = item?.detailJson?.senderPet;
  const isEgg = senderPet && "eggId" in senderPet;
  const isPet = senderPet && "petId" in senderPet;

  const { mutate: updateParentStatus } = useMutation({
    mutationFn: ({ relationId, status, opponentId }: UpdateParentDto) =>
      parentControllerUpdateParentRequest({ relationId, status, opponentId }),
    onSuccess: (res, variables) => {
      if (res?.data?.success) {
        toast.success(
          res?.data?.message ??
            `부모 연동이 ${variables.status === UpdateParentDtoStatus.APPROVED ? "수락" : variables.status === UpdateParentDtoStatus.CANCELLED ? "취소" : "거절"} 되었습니다.`,
        );
        queryClient.invalidateQueries({ queryKey: [userNotificationControllerFindAll.name] });

        if (item) {
          setSelected({
            ...item,
            type:
              variables.status === UpdateParentDtoStatus.APPROVED
                ? UserNotificationDtoType.PARENT_ACCEPT
                : UserNotificationDtoType.PARENT_REJECT,
          });
        }
      }
    },
    onError: () => {
      toast.error("부모 연동 상태 변경에 실패했습니다.");
    },
  });

  const { mutate: deleteNotification } = useMutation({
    mutationFn: ({ id, receiverId }: { id: number; receiverId: string }) =>
      userNotificationControllerDelete({ id, receiverId }),
    onSuccess: (res) => {
      if (res?.data?.success) {
        toast.success("알림이 삭제되었습니다.");

        queryClient.invalidateQueries({ queryKey: [userNotificationControllerFindAll.name] });
        router.push("/noti");
      }
    },
    onError: () => {
      toast.error("알림 삭제에 실패했습니다.");
    },
  });

  const handleUpdate = (status: UpdateParentDtoStatus) => {
    if (!item?.senderId || !item?.targetId) return;

    updateParentStatus({
      relationId: Number(item.targetId),
      status,
      opponentId: item.senderId,
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={!item}
              onClick={() => {
                if (item?.id && item?.receiverId) {
                  deleteNotification({ id: item?.id, receiverId: item?.receiverId });
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>삭제</TooltipContent>
        </Tooltip>

        {item?.type === UserNotificationDtoType.PARENT_REQUEST && (
          <form>
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleUpdate(UpdateParentDtoStatus.REJECTED);
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
                    handleUpdate(UpdateParentDtoStatus.APPROVED);
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
            <div className="flex items-center gap-4 text-sm">
              <Avatar>
                <AvatarImage alt="보내는 사람" />
                <AvatarFallback>{isEgg ? "🐣" : "A"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Badge
                  className={cn(
                    "my-1 px-2 text-sm font-semibold",
                    NOTIFICATION_TYPE[item.type as keyof typeof NOTIFICATION_TYPE].color,
                  )}
                >
                  {NOTIFICATION_TYPE[item.type as keyof typeof NOTIFICATION_TYPE].label}
                </Badge>
                <NotiTitle hasLink receiverPet={receiverPet} senderPet={senderPet} />
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

          <div className="whitespace-pre-wrap p-4 text-sm">
            <span className="font-bold">
              {item?.type !== UserNotificationDtoType.PARENT_REQUEST && "내가 보낸 요청 메시지"}
            </span>

            <div>{String(item?.detailJson?.message ?? "")}</div>
          </div>

          <Link
            href={`/${isEgg ? "egg" : "pet"}/${isEgg ? senderPet?.eggId : senderPet?.petId}`}
            className="group mx-4 mt-4 flex flex-col rounded-lg border p-3 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
          >
            <div className="flex flex-col gap-3">
              {senderPet && "photos" in senderPet && senderPet?.photos ? (
                <div className="relative h-48 w-full overflow-hidden rounded-lg">
                  <Image
                    src={
                      "photos" in senderPet && Array.isArray(senderPet.photos)
                        ? (senderPet.photos[0] ?? "/default-pet-image.png")
                        : "/default-pet-image.png"
                    }
                    alt={senderPet?.name ?? "펫 이미지"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 384px"
                  />
                </div>
              ) : (
                <div className="bg-foreground/70 flex h-48 w-full items-center justify-center rounded-lg">
                  <span className="text-4xl">{isEgg ? "🥚" : "🔗"}</span>
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-base">
                    <span className="font-bold">{senderPet?.name}</span>
                    {isEgg ? " 알 " : " 펫 "}
                    프로필로 이동
                  </span>
                  <ArrowUpRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <div className="flex gap-1">
                  {isPet &&
                    senderPet?.morphs?.map((morph) => (
                      <Badge
                        key={morph}
                        className="whitespace-nowrap bg-yellow-500/80 font-bold text-black backdrop-blur-sm"
                      >
                        {morph}
                      </Badge>
                    ))}
                  {isPet &&
                    senderPet?.traits?.map((trait) => (
                      <Badge
                        variant="outline"
                        key={trait}
                        className="whitespace-nowrap bg-white font-bold text-black backdrop-blur-sm"
                      >
                        {trait}
                      </Badge>
                    ))}
                  <span className="text-muted-foreground text-xs">
                    {isEgg &&
                      senderPet?.layingDate &&
                      formatDateToYYYYMMDDString(senderPet?.layingDate)}
                    {isEgg && senderPet?.clutch && `◦ ${senderPet?.clutch}개`}
                    {isEgg && senderPet?.clutchOrder && `◦ ${senderPet?.clutchOrder}번째`}
                  </span>
                </div>
                {senderPet && "desc" in senderPet && senderPet?.desc && (
                  <div className="mt-2 text-sm">{senderPet?.desc}</div>
                )}
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <div className="text-muted-foreground p-8 text-center">알림을 선택해주세요. </div>
      )}
    </div>
  );
}

export default NotiDisplay;
