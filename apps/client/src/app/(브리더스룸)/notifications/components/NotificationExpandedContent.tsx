import {
  UserNotificationDto,
  UserNotificationDtoType,
  UpdateParentRequestDtoStatus,
  AdoptionHistoryDtoMethod,
} from "@repo/api-client";
import { ParentLinkDetailJson } from "@repo/api-client";
import { castDetailJson, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { overlay } from "overlay-kit";
import { DateTime } from "luxon";
import Link from "next/link";
import Dialog from "../../components/Form/Dialog";
import PetLinkCard from "./PetLinkCard";
import PetThumbnail from "@/components/common/PetThumbnail";
import NotificationActions from "./NotificationActions";
import { ADOPTION_METHOD_KOREAN_INFO } from "../../constants";

/** ADOPTION_COMPLETE detailJson 의 타입 */
interface AdoptionDetailJson {
  seller?: { id: string; name?: string };
  primaryPet?: { id: string; name?: string };
  adoptionDate?: string | null;
  price?: number | null;
  method?: AdoptionHistoryDtoMethod | null;
}

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

/** 삭제 버튼 */
const DeleteButton = ({
  item,
  onDeleteNotification,
}: {
  item: UserNotificationDto;
  onDeleteNotification: (close?: () => void) => Promise<void>;
}) => (
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
);

/** 분양 완료 알림 확장 콘텐츠 */
const AdoptionCompleteContent = ({
  item,
  onDeleteNotification,
}: {
  item: UserNotificationDto;
  onDeleteNotification: (close?: () => void) => Promise<void>;
}) => {
  const detail = item.detailJson as AdoptionDetailJson | undefined;
  if (!detail) return null;

  const infoItems: { label: string; value: string; href?: string }[] = [];
  if (detail.primaryPet?.name) {
    infoItems.push({
      label: "개체",
      value: detail.primaryPet.name,
      href: `/pet/${detail.primaryPet.id}`,
    });
  }
  if (detail.adoptionDate) {
    const dt = DateTime.fromISO(detail.adoptionDate);
    infoItems.push({
      label: "분양일",
      value: dt.isValid ? dt.toFormat("yyyy.MM.dd") : detail.adoptionDate,
    });
  }
  if (detail.price != null) {
    infoItems.push({ label: "가격", value: `${detail.price.toLocaleString()}원` });
  }
  if (detail.method) {
    infoItems.push({
      label: "분양 방식",
      value: ADOPTION_METHOD_KOREAN_INFO[detail.method] ?? detail.method,
    });
  }

  return (
    <div className="flex items-start gap-3">
      {/* 좌: 펫 썸네일 */}
      {detail.primaryPet?.id && (
        <Link href={`/pet/${detail.primaryPet.id}`} className="block w-[80px] shrink-0 self-center">
          <PetThumbnail
            petId={detail.primaryPet.id}
            alt={detail.primaryPet.name}
            maxSize={128}
            objectFit="cover"
          />
        </Link>
      )}

      {/* 우: 분양 정보 */}
      <div className="flex min-w-0 flex-1 flex-col self-center pt-1">
        {infoItems.map(({ label, value, href }) => (
          <div key={label} className="flex items-baseline">
            <span className="w-16 shrink-0 text-[11px] text-gray-500 dark:text-gray-400">
              {label}
            </span>
            {href ? (
              <Link
                href={href}
                className="truncate text-sm font-bold text-gray-900 dark:text-gray-100"
              >
                {value}
              </Link>
            ) : (
              <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
                {value}
              </span>
            )}
          </div>
        ))}
      </div>

      <DeleteButton item={item} onDeleteNotification={onDeleteNotification} />
    </div>
  );
};

const NotificationExpandedContent = ({
  item,
  isOpen,
  className,
  onDeleteNotification,
  onUpdate,
  onClose,
}: NotificationExpandedContentProps) => {
  const isAdoption = item.type === UserNotificationDtoType.ADOPTION_COMPLETE;
  const detailData = castDetailJson<ParentLinkDetailJson>(item.type, item?.detailJson);

  const alreadyProcessed =
    item?.type === UserNotificationDtoType.PARENT_REQUEST &&
    !!detailData?.status &&
    detailData?.status !== UpdateParentRequestDtoStatus.PENDING;

  return (
    <div
      className={cn(
        "grid max-w-[500px] overflow-hidden bg-gray-100 transition-all duration-300 ease-in-out dark:bg-[#161618]",
        isOpen ? "grid-rows-[1fr] p-2 opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="overflow-hidden">
        <div className="flex flex-col gap-2">
          {isAdoption ? (
            <AdoptionCompleteContent item={item} onDeleteNotification={onDeleteNotification} />
          ) : (
            <>
              <div className="flex flex-1">
                <div className="flex flex-col gap-3">
                  {/* 거절 사유 (거절된 경우에만 표시) */}
                  {item.type === UserNotificationDtoType.PARENT_REJECT &&
                    detailData?.rejectReason && (
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
                    <p className="text-sm font-[600] whitespace-pre-wrap text-gray-800 dark:text-gray-400">
                      {detailData?.message || "메시지가 없습니다."}
                    </p>
                  </div>
                </div>

                <DeleteButton item={item} onDeleteNotification={onDeleteNotification} />
              </div>

              {/* 자식 펫 정보 카드 */}
              <PetLinkCard detailData={detailData} />

              {/* 액션 버튼 (부모 연동 요청인 경우) */}
              {item.type === UserNotificationDtoType.PARENT_REQUEST && !alreadyProcessed && (
                <NotificationActions onUpdate={onUpdate} onClose={onClose} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationExpandedContent;
