import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowUpRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  parentRequestControllerUpdateStatus,
  ParentLinkDetailJson,
  UpdateParentRequestDto,
  UpdateParentRequestDtoStatus,
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
import { castDetailJson, cn, formatDateToYYYYMMDDString } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { isString } from "es-toolkit";
import { isNumber } from "@/lib/typeGuards";
import { memo } from "react";
import { overlay } from "overlay-kit";
import RejectModal from "./RejectModal";
import { AxiosError } from "axios";
import StatusBadge from "./StatusBadge";
import Dialog from "../../components/Form/Dialog";
import PetThumbnail from "../../components/PetThumbnail";

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

  const detailData = castDetailJson<ParentLinkDetailJson>(data?.type, data?.detailJson);
  const alreadyProcessed =
    data?.type === UserNotificationDtoType.PARENT_REQUEST &&
    !!detailData?.status &&
    detailData?.status !== UpdateParentRequestDtoStatus.PENDING;

  const { mutateAsync: updateParentStatus } = useMutation({
    mutationFn: ({ id, status, rejectReason }: UpdateParentRequestDto & { id: number }) =>
      parentRequestControllerUpdateStatus(id, { status, rejectReason }),
  });

  const { mutateAsync: deleteNotification } = useMutation({
    mutationFn: ({ id, receiverId }: { id: number; receiverId: string }) =>
      userNotificationControllerDelete({ id, receiverId }),
  });

  const handleProcessedRequest = () => {
    toast.error("이미 처리된 요청입니다.");
  };

  const handleUpdate = async (
    status: UpdateParentRequestDtoStatus,
    rejectReason?: string,
    close?: () => void,
  ) => {
    if (alreadyProcessed) return handleProcessedRequest();

    if (!data?.senderId || data?.targetId === undefined || data?.targetId === null) return;

    try {
      const res = await updateParentStatus({
        id: data.id,
        status,
        rejectReason,
      });

      toast.success(
        res?.data?.message ??
          `부모 연동이 ${status === UpdateParentRequestDtoStatus.APPROVED ? "수락" : status === UpdateParentRequestDtoStatus.CANCELLED ? "취소" : "거절"} 되었습니다.`,
      );
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error?.response?.data?.message ?? "부모 연동 상태 변경에 실패했습니다.");
      }
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [userNotificationControllerFindOne.name, id] }),
        queryClient.invalidateQueries({ queryKey: [userNotificationControllerFindAll.name] }),
      ]);
      close?.();
    }
  };

  const renderMorphs = () => {
    if (
      !detailData ||
      !("morphs" in detailData) ||
      !detailData.morphs ||
      !Array.isArray(detailData.morphs)
    ) {
      return null;
    }
    return detailData.morphs.map((morph: string) => (
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
      !detailData ||
      !("traits" in detailData) ||
      !detailData.traits ||
      !Array.isArray(detailData.traits)
    ) {
      return null;
    }
    return detailData.traits.map((trait: string) => (
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
    if (!detailData) return null;

    const parts = [];
    if ("layingDate" in detailData && detailData.layingDate && isNumber(detailData.layingDate)) {
      parts.push(formatDateToYYYYMMDDString(detailData.layingDate));
    }
    if ("clutch" in detailData && detailData.clutch && isNumber(detailData.clutch)) {
      parts.push(`◦ ${detailData.clutch}개`);
    }
    if ("clutchOrder" in detailData && detailData.clutchOrder && isNumber(detailData.clutchOrder)) {
      parts.push(`◦ ${detailData.clutchOrder}번째`);
    }

    return parts.length > 0 ? parts.join(" ") : null;
  };

  const handleDeleteNotification = async (close?: () => void) => {
    if (!data?.id || !data?.receiverId) return;
    try {
      const res = await deleteNotification({ id: data.id, receiverId: data.receiverId });
      if (res?.data?.success) {
        toast.success("알림이 삭제되었습니다.");

        queryClient.invalidateQueries({ queryKey: [userNotificationControllerFindAll.name] });
        router.push("/noti");
      }
    } catch {
      toast.error("알림 삭제에 실패했습니다.");
    } finally {
      close?.();
    }
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
                  overlay.open(({ isOpen, close, unmount }) => (
                    <Dialog
                      title="알림 삭제"
                      description="알림을 삭제하시겠습니까?"
                      onExit={unmount}
                      isOpen={isOpen}
                      onCloseAction={close}
                      onConfirmAction={() => handleDeleteNotification(close)}
                    />
                  ));
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
                    if (alreadyProcessed) return handleProcessedRequest();

                    overlay.open(({ isOpen, close }) => (
                      <RejectModal
                        isOpen={isOpen}
                        close={close}
                        handleUpdate={(status, rejectReason) =>
                          handleUpdate(status, rejectReason, close)
                        }
                      />
                    ));
                  }}
                  disabled={alreadyProcessed}
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
                  disabled={alreadyProcessed}
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
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "my-1 px-2 text-sm font-semibold",
                      NOTIFICATION_TYPE[data.type].color,
                    )}
                  >
                    {NOTIFICATION_TYPE[data.type].label}
                  </Badge>
                  <StatusBadge item={data} />
                </div>
                <NotiTitle
                  href={detailData?.parentPet?.id ? `/pet/${detailData.parentPet.id}` : undefined}
                  displayText={detailData?.childPet?.name ?? ""}
                  label={detailData?.parentPet?.name}
                />
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
            <div
              className={cn(
                "flex flex-col",
                data?.type === UserNotificationDtoType.PARENT_REJECT && "text-muted-foreground",
              )}
            >
              <span className="font-bold">
                {(data?.type === UserNotificationDtoType.PARENT_ACCEPT ||
                  data?.type === UserNotificationDtoType.PARENT_REJECT ||
                  data?.type === UserNotificationDtoType.PARENT_REQUEST) &&
                  "요청 메시지"}
              </span>
              <div>{String(detailData?.message ?? "")}</div>
            </div>

            {data?.type === UserNotificationDtoType.PARENT_REJECT && (
              <div className="mt-4 flex flex-col">
                <span className="font-bold">거절 사유</span>
                <span>{detailData?.rejectReason ?? "거절 사유가 없습니다."}</span>
              </div>
            )}
          </div>

          <Link
            href={`/pet/${detailData?.childPet?.id && isString(detailData.childPet.id) ? detailData.childPet.id : ""}`}
            className="group mx-4 mt-4 flex flex-col rounded-lg border p-3 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
          >
            <div className="flex flex-col gap-3">
              {detailData?.childPet?.photos ? (
                <div className="relative w-full overflow-hidden rounded-lg">
                  <PetThumbnail
                    imageUrl={detailData?.childPet?.photos[0]?.url}
                    alt={detailData?.childPet?.name}
                  />
                </div>
              ) : (
                <div className="bg-foreground/70 dark:bg-foreground/30 flex h-48 w-full items-center justify-center rounded-lg">
                  <span className="text-4xl">🔗</span>
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-base">
                    <span className="font-bold">
                      {detailData?.childPet?.name && isString(detailData.childPet.name)
                        ? detailData.childPet.name
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
                {detailData &&
                "desc" in detailData &&
                detailData.desc &&
                isString(detailData.desc) ? (
                  <div className="mt-2 text-sm">{detailData.desc}</div>
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
