import {
  UserNotificationDto,
  UserNotificationDtoStatus,
  UpdateParentRequestDtoStatus,
} from "@repo/api-client";
import { useCallback, useState } from "react";
import { toast } from "@/lib/toast";
import { useNotificationRead } from "@/hooks/useNotificationRead";
import { useNotificationActions } from "../hooks/useNotificationActions";
import NotificationHeader from "./NotificationHeader";
import NotificationExpandedContent from "./NotificationExpandedContent";

const NotificationItem = ({
  item,
  expandedContentClassName = "",
}: {
  item: UserNotificationDto;

  expandedContentClassName?: string;
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { setNotificationRead } = useNotificationRead();
  const { handleUpdate, handleDeleteNotification } = useNotificationActions();

  const handleItemClick = useCallback(
    async (item: UserNotificationDto) => {
      if (!item) return;

      try {
        await setNotificationRead(item);
      } catch {
        toast.error("알림 읽음 처리에 실패했습니다.");
      }
    },
    [setNotificationRead],
  );

  const handleUpdateWrapper = async (
    status: UpdateParentRequestDtoStatus,
    rejectReason?: string,
    close?: () => void,
  ) => {
    if (!item?.id) return;
    await handleUpdate(item.id, status, rejectReason, close);
  };

  const handleDeleteWrapper = async (close?: () => void) => {
    if (!item?.id || !item?.receiverId) return;
    await handleDeleteNotification(item.id, item.receiverId, close);
  };

  return (
    <>
      <button
        type="button"
        className="flex items-center justify-between gap-2 rounded-xl px-2 py-1 hover:bg-gray-50 hover:shadow-lg dark:hover:bg-neutral-800"
        onClick={async () => {
          setIsNotificationOpen((prev) => !prev);

          if (!isNotificationOpen && item.status === UserNotificationDtoStatus.UNREAD) {
            await handleItemClick(item);
          }
        }}
      >
        <NotificationHeader item={item} isOpen={isNotificationOpen} />
      </button>

      <NotificationExpandedContent
        item={item}
        isOpen={isNotificationOpen}
        onDeleteNotification={handleDeleteWrapper}
        onUpdate={handleUpdateWrapper}
        onClose={() => setIsNotificationOpen(false)}
        className={expandedContentClassName}
      />
    </>
  );
};

export default NotificationItem;
