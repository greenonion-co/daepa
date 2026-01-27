import {
  UserNotificationDto,
  UserNotificationDtoStatus,
  UpdateParentRequestDtoStatus,
} from "@repo/api-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { useNotificationRead } from "@/hooks/useNotificationRead";
import { useNotificationActions } from "../hooks/useNotificationActions";
import NotificationHeader from "./NotificationHeader";
import NotificationExpandedContent from "./NotificationExpandedContent";

const NotificationItem = ({
  item,
  expandedContentClassName = "",
  defaultOpen = false,
}: {
  item: UserNotificationDto;
  expandedContentClassName?: string;
  defaultOpen?: boolean;
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(defaultOpen);
  const itemRef = useRef<HTMLButtonElement>(null);
  const { setNotificationRead } = useNotificationRead();

  // defaultOpen이 true이면 해당 아이템으로 스크롤 및 읽음 처리
  useEffect(() => {
    if (defaultOpen && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: "smooth", block: "center" });

      // 읽지 않은 알림이면 읽음 처리
      if (item.status === UserNotificationDtoStatus.UNREAD) {
        setNotificationRead(item).catch(() => {
          // 읽음 처리 실패 시 무시
        });
      }
    }
  }, [defaultOpen, item, setNotificationRead]);
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
        ref={itemRef}
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
