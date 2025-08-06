import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  parentRequestControllerUpdateStatus,
  UpdateParentRequestDtoStatus,
  UpdateParentRequestDto,
  userNotificationControllerDelete,
  userNotificationControllerFindAll,
  userNotificationControllerFindOne,
  UserNotificationDtoType,
} from "@repo/api-client";
import Link from "next/link";
import { toast } from "sonner";
import { NOTIFICATION_TYPE } from "../../constants";
import { Badge } from "@/components/ui/badge";
import NotiTitle from "./NotiTitle";
import { cn, formatDateToYYYYMMDDString } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { isPlainObject, isString } from "es-toolkit";
import { isNumber } from "@/lib/typeGuards";
import { memo } from "react";
import { ParentRequestDetailJsonDto } from "../../register/types";
import { overlay } from "overlay-kit";
import Dialog from "../../components/Form/Dialog";

const NotiDisplay = memo(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const id = searchParams.get("id");

  const { data } = useQuery({
    queryKey: [userNotificationControllerFindOne.name, id],
    queryFn: () => userNotificationControllerFindOne(Number(id)),
    enabled: !!id,
    select: (res) => res?.data?.data,
  });

  const detailData = data?.detailJson as unknown as ParentRequestDetailJsonDto;

  const { mutate: updateParentStatus } = useMutation({
    mutationFn: ({ id, status, rejectReason }: UpdateParentRequestDto & { id: number }) =>
      parentRequestControllerUpdateStatus(id, { status, rejectReason }),
    onSuccess: (res, variables) => {
      toast.success(
        res?.data?.message ??
          `부모 연동이 ${variables.status === UpdateParentRequestDtoStatus.APPROVED ? "수락" : variables.status === UpdateParentRequestDtoStatus.CANCELLED ? "취소" : "거절"} 되었습니다.`,
      );

      queryClient.invalidateQueries({ queryKey: [userNotificationControllerFindOne.name, id] });
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

  const handleUpdate = (status: UpdateParentRequestDtoStatus, rejectReason?: string) => {
    if (!data?.senderId || !data?.targetId) return;

    updateParentStatus({
      id: data.id,
      status,
      rejectReason,
    });
  };

  const getDetailData = () => {
    if (!detailData || !isPlainObject(detailData)) {
      return null;
    }
    return detailData;
  };

  const safeData = getDetailData();

  const renderMorphs = () => {
    if (
      !safeData ||
      !("morphs" in safeData) ||
      !safeData.morphs ||
      !Array.isArray(safeData.morphs)
    ) {
      return null;
    }
    return safeData.morphs.map((morph: string) => (
      <Badge
        key={morph}
        className="whitespace-nowrap bg-yellow-500/80 font-bold text-black backdrop-blur-sm"
      >
        {morph}
      </Badge>
    ));
  };

  const renderTraits = () => {
    if (
      !safeData ||
      !("traits" in safeData) ||
      !safeData.traits ||
      !Array.isArray(safeData.traits)
    ) {
      return null;
    }
    return safeData.traits.map((trait: string) => (
      <Badge
        variant="outline"
        key={trait}
        className="whitespace-nowrap bg-white font-bold text-black backdrop-blur-sm"
      >
        {trait}
      </Badge>
    ));
  };

  const renderLayingInfo = () => {
    if (!safeData) return null;

    const parts = [];
    if ("layingDate" in safeData && safeData.layingDate && isNumber(safeData.layingDate)) {
      parts.push(formatDateToYYYYMMDDString(safeData.layingDate));
    }
    if ("clutch" in safeData && safeData.clutch && isNumber(safeData.clutch)) {
      parts.push(`◦ ${safeData.clutch}개`);
    }
    if ("clutchOrder" in safeData && safeData.clutchOrder && isNumber(safeData.clutchOrder)) {
      parts.push(`◦ ${safeData.clutchOrder}번째`);
    }

    return parts.length > 0 ? parts.join(" ") : null;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={!data}
              onClick={() => {
                if (data?.id && data?.receiverId) {
                  deleteNotification({ id: data?.id, receiverId: data?.receiverId });
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>삭제</TooltipContent>
        </Tooltip>

        {data?.type === UserNotificationDtoType.PARENT_REQUEST && (
          <form>
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    overlay.open(({ isOpen, close }) => (
                      <Dialog
                        title="요청 거절"
                        description="요청을 거절하시겠습니까?"
                        isOpen={isOpen}
                        onCloseAction={close}
                        onConfirmAction={() => {
                          handleUpdate(UpdateParentRequestDtoStatus.REJECTED, "거절합니다.");
                          close();
                        }}
                        onExit={close}
                      />
                    ));
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
                    handleUpdate(UpdateParentRequestDtoStatus.APPROVED);
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
      {data ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-center gap-4 text-sm">
              <Avatar>
                <AvatarImage alt="보내는 사람" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Badge
                  className={cn(
                    "my-1 px-2 text-sm font-semibold",
                    NOTIFICATION_TYPE[data.type as keyof typeof NOTIFICATION_TYPE].color,
                  )}
                >
                  {NOTIFICATION_TYPE[data.type as keyof typeof NOTIFICATION_TYPE].label}
                </Badge>
                <NotiTitle hasLink detailData={detailData} />
              </div>
            </div>
            {data.createdAt && (
              <div className="text-muted-foreground ml-auto text-xs">
                {format(new Date(data.createdAt), "PPP EE p", { locale: ko })}
                {data.updatedAt !== data.createdAt && (
                  <div className="flex items-center gap-1">
                    {formatDistanceToNow(new Date(data.updatedAt), {
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
              {data?.type !== UserNotificationDtoType.PARENT_REQUEST && "내가 보낸 요청 메시지"}
            </span>

            <div>{String(safeData?.message ?? "")}</div>
          </div>

          <Link
            href={`/pet/${safeData?.childPet?.id && isString(safeData.childPet.id) ? safeData.childPet.id : ""}`}
            className="group mx-4 mt-4 flex flex-col rounded-lg border p-3 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
          >
            <div className="flex flex-col gap-3">
              {detailData && "photos" in detailData && detailData?.photos ? (
                <div className="relative h-48 w-full overflow-hidden rounded-lg">
                  <Image
                    src={
                      "photos" in detailData && Array.isArray(detailData.photos)
                        ? (detailData.photos[0] ?? "/default-pet-image.png")
                        : "/default-pet-image.png"
                    }
                    alt={
                      safeData?.childPet?.name && isString(safeData.childPet.name)
                        ? safeData.childPet.name
                        : "펫 이미지"
                    }
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 384px"
                  />
                </div>
              ) : (
                <div className="bg-foreground/70 flex h-48 w-full items-center justify-center rounded-lg">
                  <span className="text-4xl">🔗</span>
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-base">
                    <span className="font-bold">
                      {safeData?.childPet?.name && isString(safeData.childPet.name)
                        ? safeData.childPet.name
                        : ""}
                    </span>
                    프로필로 이동
                  </span>
                  <ArrowUpRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <div className="flex gap-1">
                  {renderMorphs()}
                  {renderTraits()}
                  <span className="text-muted-foreground text-xs">{renderLayingInfo()}</span>
                </div>
                {safeData && "desc" in safeData && safeData.desc && isString(safeData.desc) ? (
                  <div className="mt-2 text-sm">{safeData.desc}</div>
                ) : null}
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <div className="text-muted-foreground p-8 text-center">알림을 선택해주세요. </div>
      )}
    </div>
  );
});
NotiDisplay.displayName = "NotiDisplay";

export default NotiDisplay;
