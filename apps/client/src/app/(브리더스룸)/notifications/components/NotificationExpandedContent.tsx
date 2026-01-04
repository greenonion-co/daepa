import {
  UserNotificationDto,
  UserNotificationDtoType,
  UpdateParentRequestDtoStatus,
} from "@repo/api-client";
import { ParentLinkDetailJson } from "@repo/api-client";
import { castDetailJson, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { overlay } from "overlay-kit";
import Dialog from "../../components/Form/Dialog";
import PetLinkCard from "./PetLinkCard";
import NotificationActions from "./NotificationActions";

interface NotificationExpandedContentProps {
  item: UserNotificationDto;
  isOpen: boolean;
  className: string;
  onDeleteNotification: (close?: () => void) => Promise<void>;
  onUpdate: (
    status: UpdateParentRequestDtoStatus,
    rejectReason?: string,
    close?: () => void,
  ) => Promise<void>;
  onClose: () => void;
}

const NotificationExpandedContent = ({
  item,
  isOpen,
  className,
  onDeleteNotification,
  onUpdate,
  onClose,
}: NotificationExpandedContentProps) => {
  const detailData = castDetailJson<ParentLinkDetailJson>(item.type, item?.detailJson);

  const alreadyProcessed =
    item?.type === UserNotificationDtoType.PARENT_REQUEST &&
    !!detailData?.status &&
    detailData?.status !== UpdateParentRequestDtoStatus.PENDING;

  return (
    <div
      className={cn(
        "grid max-w-[500px] overflow-hidden bg-gray-100 transition-all duration-300 ease-in-out dark:bg-neutral-900",
        isOpen ? "grid-rows-[1fr] p-2 opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="overflow-hidden">
        <div className="flex flex-col gap-2">
          <div className="flex flex-1">
            <div className="flex flex-col gap-3">
              {/* 거절 사유 (거절된 경우에만 표시) */}
              {item.type === UserNotificationDtoType.PARENT_REJECT && detailData?.rejectReason && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-700 dark:text-gray-300">거절 사유</span>
                  <p className="text-sm font-[600] text-gray-800 dark:text-gray-400">
                    {detailData.rejectReason}
                  </p>
                </div>
              )}

              {/* 요청 메시지 */}
              <div className="flex flex-col">
                <span className="text-xs text-gray-700 dark:text-gray-300">요청 메시지</span>
                <p className="whitespace-pre-wrap text-sm font-[600] text-gray-800 dark:text-gray-400">
                  {detailData?.message || "메시지가 없습니다."}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              className="ml-auto flex"
              size="icon"
              disabled={!item}
              onClick={() => {
                if (item?.id && item?.receiverId) {
                  overlay.open(({ isOpen, close, unmount }) => (
                    <Dialog
                      title="알림 삭제"
                      description="알림을 삭제하시겠습니까?"
                      onExit={unmount}
                      isOpen={isOpen}
                      onCloseAction={close}
                      onConfirmAction={() => onDeleteNotification(close)}
                    />
                  ));
                }
              }}
            >
              <Trash2 className="h-4 w-4" color="red" />
            </Button>
          </div>

          {/* 자식 펫 정보 카드 */}
          <PetLinkCard detailData={detailData} />

          {/* 액션 버튼 (부모 연동 요청인 경우) */}
          {item.type === UserNotificationDtoType.PARENT_REQUEST && !alreadyProcessed && (
            <NotificationActions onUpdate={onUpdate} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationExpandedContent;
