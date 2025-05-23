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
import { useMutation } from "@tanstack/react-query";
import {
  parentControllerUpdateParentStatus,
  ParentDtoStatus,
  UpdateParentDto,
  UserNotificationDtoType,
} from "@repo/api-client";
import Link from "next/link";

export function NotiDisplay() {
  const { selected: item } = useNotiStore();

  const { mutate: updateParentStatus } = useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: UpdateParentDto }) =>
      parentControllerUpdateParentStatus(petId, data),
  });

  const handleUpdate = (status: ParentDtoStatus) => {
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

        {item?.type === UserNotificationDtoType.parent_request && (
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
                <div className="font-semibold">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/pet/${item.detailJson.targetPet.petId}`}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1 py-0.5 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900"
                      >
                        {item.detailJson.targetPet.name}
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>펫 상세 페이지로 이동</TooltipContent>
                  </Tooltip>{" "}
                  의 펫{" "}
                  <span className="text-sky-600 dark:text-sky-400">
                    {item.detailJson.requestPet.name}
                  </span>{" "}
                  의{" "}
                  <span className="text-sky-600 dark:text-sky-400">
                    {item.detailJson.targetPet.sex === "M" ? "부" : "모"}
                  </span>{" "}
                  연동 요청
                </div>
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

          {/* 광고 배너 형태의 링크 */}
          <Link
            href={`/pet/${item.detailJson.requestPet.petId}`}
            className="bg-card hover:bg-accent group mx-4 mt-4 flex items-center justify-between rounded-lg border p-3 shadow-sm transition-colors"
          >
            <div className="flex items-center gap-3">
              {item.detailJson.requestPet.photo ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src={item.detailJson.requestPet.photo ?? "/default-pet-image.png"}
                    alt={item.detailJson.requestPet.name ?? "펫 이미지"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-lg">🔗</span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {item.detailJson.requestPet.name} 펫 프로필로 이동
                </span>
                <span className="text-muted-foreground text-xs">클릭하여 자세한 정보 확인하기</span>
              </div>
            </div>
            <ArrowUpRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>

          {/* 메시지 내용 */}
          <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
            {item.detailJson.targetPet.message}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground p-8 text-center">알림을 선택해주세요. </div>
      )}
    </div>
  );
}

export default NotiDisplay;
