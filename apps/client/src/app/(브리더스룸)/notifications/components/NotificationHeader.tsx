import {
  UserNotificationDto,
  UserNotificationDtoStatus,
  UserNotificationDtoType,
  UpdateParentRequestDtoStatus,
} from "@repo/api-client";
import { ParentLinkDetailJson } from "@repo/api-client";
import { castDetailJson, cn } from "@/lib/utils";
import { DateTime } from "luxon";
import { NOTIFICATION_MESSAGE, STATUS_MAP } from "../../constants";
import { ChevronDown } from "lucide-react";
import PetThumbnail from "@/components/common/PetThumbnail";

interface NotificationHeaderProps {
  item: UserNotificationDto;
  isOpen: boolean;
}

/** 알림의 주 개체 petId 를 추출 (타입 무관, primaryPet 우선 + 구버전 호환) */
const getThumbnailPetId = (
  item: UserNotificationDto,
): string | undefined => {
  const detail = item.detailJson as Record<string, unknown> | undefined;
  if (!detail) return undefined;

  // 새 구조 (primaryPet) 우선, 구버전 (childPet / pet) fallback
  return (
    (detail.primaryPet as { id?: string })?.id ??
    (detail.childPet as { id?: string })?.id ??
    (detail.pet as { id?: string })?.id
  );
};

const NotificationHeader = ({ item, isOpen }: NotificationHeaderProps) => {
  const detailData = castDetailJson<ParentLinkDetailJson>(item.type, item?.detailJson);
  const thumbnailPetId = getThumbnailPetId(item);

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-2">
          <div className="relative h-15 w-15 rounded-full bg-gray-100">
            {thumbnailPetId && (
              <PetThumbnail petId={thumbnailPetId} maxSize={60} rounded />
            )}
          </div>
        </div>
        <div className="text-left text-sm">
          {item.type === UserNotificationDtoType.PARENT_REQUEST && (
            <div
              className={cn(
                STATUS_MAP[detailData?.status ?? UpdateParentRequestDtoStatus.PENDING]?.color,
                "mb-1 flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] leading-none font-medium",
              )}
            >
              {STATUS_MAP[detailData?.status ?? UpdateParentRequestDtoStatus.PENDING]?.label}
            </div>
          )}

          <span className="font-bold">{item.senderName ?? "(알 수 없음)"}</span>
          {NOTIFICATION_MESSAGE[item.type]}
          <span className="text-muted-foreground pl-1">
            {(() => {
              if (!item.createdAt) return "";
              const dt = DateTime.fromISO(item.createdAt);
              return dt.isValid ? dt.setLocale("ko").toRelative() : "";
            })()}
          </span>
          {item.status === UserNotificationDtoStatus.UNREAD && (
            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
          )}
        </div>
      </div>

      <div className="h-7 w-7">
        <ChevronDown
          className={cn(
            "text-gray-500 transition-transform duration-300 dark:text-neutral-400",
            isOpen && "rotate-180",
          )}
        />
      </div>
    </div>
  );
};

export default NotificationHeader;
