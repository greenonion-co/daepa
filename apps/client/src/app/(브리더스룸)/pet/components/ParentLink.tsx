"use client";

import { Search, X, Lock } from "lucide-react";
import Link from "next/link";
import { overlay } from "overlay-kit";
import ParentSearchSelector from "../../components/selector/parentSearch";
import { Button } from "@/components/ui/button";
import Dialog from "../../components/Form/Dialog";
import {
  PetControllerFindAllFilterType,
  PetDtoFather,
  PetDtoMother,
  PetDtoSpecies,
  PetHiddenStatusDtoHiddenStatus,
  PetParentDto,
  PetParentDtoStatus,
} from "@repo/api-client";
import { cn } from "@/lib/utils";
import ParentStatusBadge from "../../components/ParentStatusBadge";
import { usePathname } from "next/navigation";
import { PetParentDtoWithMessage } from "../store/parentLink";
import { useUserStore } from "../../store/user";
import PetThumbnail from "../../components/PetThumbnail";
import { useCallback } from "react";

interface ParentLinkProps {
  species?: PetDtoSpecies;
  label: "부" | "모";
  data?: PetDtoFather | PetDtoMother;
  editable?: boolean;
  petListType?: PetControllerFindAllFilterType;
  onSelect?: (item: PetParentDtoWithMessage) => void;
  onUnlink?: () => void;
}

const ParentLink = ({
  species,
  label,
  data = {} as PetDtoFather | PetDtoMother,
  editable = true,
  petListType = PetControllerFindAllFilterType.ALL,
  onSelect,
  onUnlink,
}: ParentLinkProps) => {
  const { user } = useUserStore();
  const pathname = usePathname();
  const isClickDisabled = pathname.includes("register") || pathname.includes("hatching");

  const deleteParent = useCallback(
    (data: PetParentDto) => {
      if (!data?.petId) return;

      onUnlink?.();
    },
    [onUnlink],
  );

  const handleUnlink = useCallback(
    (e: React.MouseEvent, data: PetParentDto) => {
      e.stopPropagation();

      if (isClickDisabled) {
        deleteParent(data);
        return;
      }

      overlay.open(({ isOpen, close, unmount }) => (
        <Dialog
          isOpen={isOpen}
          onCloseAction={close}
          onConfirmAction={() => {
            deleteParent(data);
            close();
          }}
          title={
            data?.status === PetParentDtoStatus.APPROVED ? "부모 연동 해제" : "부모 연동 요청 취소"
          }
          description={
            data?.status === PetParentDtoStatus.APPROVED
              ? `부모 연동을 해제하시겠습니까? \n 해제 후 다시 연동 요청을 해야 합니다.`
              : "부모 연동 요청을 취소하시겠습니까? \n 부모 개체 주인에게 취소 알림이 발송됩니다."
          }
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
        showTab={petListType === PetControllerFindAllFilterType.ALL}
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
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-200/50 dark:bg-gray-700/50">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Lock className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
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
  return (
    <div className="flex-1">
      <dt className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
        {/* TODO!: isMyPet이 아닌 경우 해당 주인의 정보를 노출 */}{" "}
        {parent?.status && <ParentStatusBadge status={parent.status} isMyPet={isMyPet} />}
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

        <Link
          href={`/pet/${parent.petId}`}
          passHref={false}
          onClick={(e) => {
            e.stopPropagation();
            if (isClickDisabled) e.preventDefault();
          }}
          className="flex flex-col items-center gap-2"
        >
          <PetThumbnail imageUrl={parent.photos?.[0]?.url} />

          <span
            className={cn(
              "relative text-[14px] font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:opacity-40",
              label === "모" ? "after:bg-red-400" : "after:bg-[#247DFE]",
            )}
          >
            {parent.name || "-"}
          </span>

          <div className="break-keep text-[14px] font-[500] text-gray-700">
            {parent.morphs?.join(" | ")}
            {parent.traits?.join(" | ")}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ParentLink;
