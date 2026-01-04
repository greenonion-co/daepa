"use client";

import { Search, X, Lock, Ban } from "lucide-react";

import { overlay } from "overlay-kit";
import ParentSearchSelector from "../../components/selector/parentSearch";
import { Button } from "@/components/ui/button";
import Dialog from "../../components/Form/Dialog";
import {
  GetParentsByPetIdResponseDtoDataFather,
  GetParentsByPetIdResponseDtoDataMother,
  PetDtoSpecies,
  PetHiddenStatusDto,
  PetHiddenStatusDtoHiddenStatus,
  PetParentDto,
  PetParentDtoStatus,
} from "@repo/api-client";
import { cn } from "@/lib/utils";
import ParentStatusBadge from "../../components/ParentStatusBadge";
import { usePathname } from "next/navigation";
import { PetParentDtoWithMessage } from "../store/parentLink";
import { useUserStore } from "../../store/user";
import { useCallback } from "react";
import PetThumbnail from "@/components/common/PetThumbnail";
import BadgeList from "../../components/BadgeList";

interface ParentLinkProps {
  species: PetDtoSpecies;
  label: "부" | "모";
  data?: GetParentsByPetIdResponseDtoDataFather | GetParentsByPetIdResponseDtoDataMother;
  editable?: boolean;
  allowMyPetOnly?: boolean;
  onSelect?: (item: PetParentDtoWithMessage) => void;
  onUnlink?: () => void;
}

const ParentLink = ({
  species,
  label,
  data,
  editable = true,
  allowMyPetOnly = false,
  onSelect,
  onUnlink,
}: ParentLinkProps) => {
  const { user } = useUserStore();
  const pathname = usePathname();
  const isClickDisabled = pathname.includes("register") || pathname.includes("hatching");

  const deleteParent = useCallback(
    (parentPetId?: string) => {
      if (!parentPetId) return;

      onUnlink?.();
    },
    [onUnlink],
  );

  const handleUnlink = useCallback(
    (e: React.MouseEvent, data: PetParentDto | PetHiddenStatusDto) => {
      e.stopPropagation();

      if (isClickDisabled) {
        deleteParent(data?.petId);
        return;
      }

      let title = "";
      let description = "";
      if ("hiddenStatus" in data) {
        title = "부모 연동 해제";
        description =
          "부모 연동을 해제하시겠습니까? \n 타인의 펫인 경우, 해제 시 연동 절차를 다시 진행해야 합니다.";
      } else {
        title = data?.status === PetParentDtoStatus.APPROVED ? "부모 연동 해제" : "부모 요청 취소";
        description =
          data?.status === PetParentDtoStatus.APPROVED
            ? "부모 연동을 해제하시겠습니까? \n 타인의 펫인 경우, 해제 시 연동 절차를 다시 진행해야 합니다."
            : "부모 연동 요청을 취소하시겠습니까? \n 부모 개체 주인에게 취소 알림이 발송됩니다.";
      }

      overlay.open(({ isOpen, close, unmount }) => (
        <Dialog
          isOpen={isOpen}
          onCloseAction={close}
          onConfirmAction={() => {
            deleteParent(data?.petId);
            close();
          }}
          title={title}
          description={description}
          onExit={unmount}
        />
      ));
    },
    [deleteParent, isClickDisabled],
  );

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editable) return;

    overlay.open(({ isOpen, close, unmount }) => (
      <ParentSearchSelector
        isOpen={isOpen}
        onClose={close}
        species={species}
        onSelect={(item) => {
          close();
          onSelect?.(item);
        }}
        sex={label === "부" ? "M" : "F"}
        onExit={unmount}
        allowMyPetOnly={allowMyPetOnly}
      />
    ));
  };

  // 보여져야 할 부모개체가 없는 경우
  const hasNoDisplayableParent =
    !data ||
    ("hiddenStatus" in data && data.hiddenStatus !== PetHiddenStatusDtoHiddenStatus.SECRET) ||
    (!("hiddenStatus" in data) && !data?.petId);

  if (hasNoDisplayableParent) {
    return (
      <div className="flex-1">
        <dt className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </dt>
        <div className="flex flex-col items-center gap-2">
          <button
            className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700"
            onClick={handleSelect}
            disabled={!editable}
          >
            {editable ? (
              <Search className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-gray-400" />
            ) : (
              <div className="text-center text-sm text-gray-400">미등록</div>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 비공개 펫인 경우
  if ("hiddenStatus" in data && data.hiddenStatus === PetHiddenStatusDtoHiddenStatus.SECRET) {
    return (
      <div className="flex-1">
        <dt className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </dt>
        <div className="flex flex-col items-center gap-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-yellow-50/50 dark:bg-gray-700/50">
            {editable && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full bg-black/50 p-0 hover:bg-black/70"
                onClick={(e) => handleUnlink(e, data)}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Lock className="h-6 w-6 text-yellow-500 dark:text-gray-500" />
              <span className="text-xs font-medium text-yellow-500 dark:text-gray-400">
                비공개 개체입니다.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const parent = data as PetParentDto;
  const isMyPet = parent.owner.userId === user?.userId;
  const isDeleted = parent.isDeleted;

  return (
    <div className="flex-1">
      <dt className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
        {parent?.status && <ParentStatusBadge status={parent.status} />}
      </dt>

      <div className="group relative block h-full w-full transition-opacity hover:opacity-95">
        {editable && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full bg-black/50 p-0 hover:bg-black/70"
            onClick={(e) => handleUnlink(e, parent)}
          >
            <X className="h-4 w-4 text-white" />
          </Button>
        )}

        <div
          onClick={(e) => {
            e.stopPropagation();
            if (isClickDisabled) e.preventDefault();
            else if (!isDeleted) window.location.href = `/pet/${parent.petId}`;
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center",
            isDeleted && "cursor-not-allowed opacity-70",
          )}
        >
          <div className="relative w-full">
            <>
              {isMyPet ? (
                <div
                  className="rounded-2xl p-[1.5px]"
                  style={{
                    background: "linear-gradient(90deg, #60a5fa, #c084fc)",
                  }}
                >
                  <div className="rounded-2xl bg-white">
                    <PetThumbnail petId={parent.petId} maxSize={220} />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl">
                  <PetThumbnail petId={parent.petId} maxSize={220} />
                </div>
              )}
              {!isMyPet && (
                <div className="flex items-center justify-center">
                  <span className="text-[12px] font-bold text-gray-500">@ {parent.owner.name}</span>
                </div>
              )}
            </>

            {isDeleted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/70">
                <Ban className="h-6 w-6 text-red-600" />
                <span className="text-sm font-medium text-red-600">삭제된 펫입니다.</span>
              </div>
            )}
          </div>

          <span
            className={cn(
              "relative pt-1 text-[14px] font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:opacity-40",
              label === "모" ? "after:bg-red-400" : "after:bg-[#247DFE]",
            )}
          >
            {parent.name ?? "-"}
          </span>

          <div className="mt-2 flex flex-col gap-1">
            <BadgeList items={parent.morphs} badgeClassName="dark:bg-gray-800 dark:text-gray-200" />
            <BadgeList
              items={parent.traits}
              variant="outline"
              badgeClassName="bg-white text-black dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentLink;
