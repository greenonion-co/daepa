import {
  MatingByParentsDto,
  PetDtoEggStatus,
  pairControllerUpdatePair,
  pairControllerGetPairList,
} from "@repo/api-client";
import { StickyNote } from "lucide-react";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import ParentCard from "./ParentCard";
import TooltipText from "../../components/TooltipText";
import PairMiniCalendar, { CalendarEventDetail } from "./PairMiniCalendar";
import { PairCardTutorialOverlay, PAIR_CARD_TUTORIAL_TARGETS } from "./PairCardTutorial";
import { toast } from "@/lib/toast";

interface PairCardProps {
  pair: MatingByParentsDto;
  onClick: () => void;
  onDateClick?: (eventData: CalendarEventDetail) => void;
  onAddMating?: (date: string) => void;
  onAddLaying?: (date: string) => void;
  onDelete?: () => void;
  showTutorial?: boolean;
  onCloseTutorial?: () => void;
  petThumbnailClickable?: boolean;
  onDescUpdated?: () => void;
  borderDisabled?: boolean;
}

const PairCard = ({
  pair,
  onClick,
  onDateClick,
  onAddMating,
  onAddLaying,
  // onDelete,
  showTutorial,
  onCloseTutorial,
  petThumbnailClickable = true,
  onDescUpdated,
  borderDisabled = false,
}: PairCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(pair.desc ?? "");

  const { mutate: saveDesc, isPending } = useMutation({
    mutationFn: (desc: string) => pairControllerUpdatePair(pair.pairId, { desc }),
    onSuccess: () => {
      toast.success("메모가 저장되었습니다.");
      queryClient.invalidateQueries({ queryKey: [pairControllerGetPairList.name] });
      onDescUpdated?.();
      setIsEditing(false);
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "메모 저장에 실패했습니다.");
      } else {
        toast.error("메모 저장에 실패했습니다.");
      }
    },
  });

  const handleMemoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDesc(pair.desc ?? "");
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditDesc(pair.desc ?? "");
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveDesc(editDesc);
  };

  // 총 유정란 개수 계산 (eggStatus가 'FERTILIZED'인 경우만)
  const totalEggs =
    pair.matingsByDate?.reduce((acc, mating) => {
      const eggCount =
        mating.layingsByDate?.reduce((sum, laying) => {
          const fertilizedCount =
            laying.layings?.filter((egg) => egg.eggStatus === PetDtoEggStatus.FERTILIZED).length ??
            0;
          return sum + fertilizedCount;
        }, 0) ?? 0;
      return acc + eggCount;
    }, 0) ?? 0;

  // 전체 알 개수 계산 (모든 eggStatus 포함)
  const totalAllEggs =
    pair.matingsByDate?.reduce((acc, mating) => {
      const eggCount =
        mating.layingsByDate?.reduce((sum, laying) => {
          return sum + (laying.layings?.length ?? 0);
        }, 0) ?? 0;
      return acc + eggCount;
    }, 0) ?? 0;

  // 총 부화 개수 계산 (eggStatus가 'HATCHED'인 경우만)
  const totalHatched =
    pair.matingsByDate?.reduce((acc, mating) => {
      const hatchedCount =
        mating.layingsByDate?.reduce((sum, laying) => {
          const hatched =
            laying.layings?.filter((egg) => egg.eggStatus === PetDtoEggStatus.HATCHED).length ?? 0;
          return sum + hatched;
        }, 0) ?? 0;
      return acc + hatchedCount;
    }, 0) ?? 0;

  return (
    <div
      ref={cardRef}
      className={`group relative flex flex-col rounded-2xl bg-white dark:bg-[#18171C] ${borderDisabled ? "border-0" : "border border-gray-200/50 p-4 shadow-lg transition-all hover:border-gray-300 hover:bg-gray-100/20 hover:shadow-xl dark:border-none dark:border-gray-700"}`}
    >
      {/* 튜토리얼 오버레이 */}
      {showTutorial && onCloseTutorial && (
        <PairCardTutorialOverlay onClose={onCloseTutorial} containerRef={cardRef} />
      )}

      {/* 부모 정보 */}
      <div
        data-tutorial={PAIR_CARD_TUTORIAL_TARGETS.PARENT_CARDS}
        className="flex flex-1 items-center gap-2"
      >
        <ParentCard parent={pair.father} petThumbnailClickable={petThumbnailClickable} />
        <ParentCard parent={pair.mother} petThumbnailClickable={petThumbnailClickable} />
      </div>

      {/* 미니 캘린더 */}
      <div data-tutorial={PAIR_CARD_TUTORIAL_TARGETS.MINI_CALENDAR}>
        <PairMiniCalendar
          matingsByDate={pair.matingsByDate ?? []}
          onDateClick={(eventData) => {
            onClick();
            onDateClick?.(eventData);
          }}
          onDetailClick={onClick}
          onAddMating={onAddMating}
          onAddLaying={onAddLaying}
        />
      </div>

      {/* 분양된 개체 포함 안내 */}
      {(pair.father?.isMine === false || pair.mother?.isMine === false) && (
        <p className="mt-1 text-center text-[11px] text-red-500">
          분양된 개체가 포함되어 메이팅·산란 추가가 불가합니다.
        </p>
      )}

      {/* 요약 정보 */}
      <div
        data-tutorial={PAIR_CARD_TUTORIAL_TARGETS.SUMMARY_INFO}
        className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600 dark:text-gray-400"
      >
        <div className="flex items-center gap-1">
          <span>유정란/전체</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {totalEggs}/{totalAllEggs}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span>
            해칭{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalHatched}</span>
          </span>
        </div>
      </div>

      {/* 메모 영역 */}
      <div
        data-tutorial={PAIR_CARD_TUTORIAL_TARGETS.MEMO_AREA}
        onClick={!isEditing ? handleMemoClick : undefined}
        className={`group/memo relative mt-3 rounded-lg border border-gray-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30 px-3 transition-all dark:border-gray-700 dark:from-[#18171C] dark:to-[#1F1E23] ${
          !isEditing ? "cursor-pointer hover:border-orange-300 hover:shadow-md" : ""
        }`}
      >
        <div className="flex items-start gap-2">
          <StickyNote className="mt-3.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />

          {isEditing ? (
            <div className="flex flex-1 flex-col gap-2 py-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                ref={textareaRef}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-lg px-2 py-1.5 text-sm focus:ring-0 focus:outline-none dark:text-gray-100"
                placeholder="메모를 입력하세요"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{editDesc.length}/500</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-black dark:hover:text-white"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center justify-center gap-1 rounded-md bg-orange-500 px-2 text-xs text-white hover:bg-orange-600 hover:font-semibold disabled:opacity-50"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center gap-2">
              <div className="flex-1 py-3 leading-tight">
                {pair.desc ? (
                  <TooltipText
                    text={pair.desc}
                    className="line-clamp-2 w-full text-sm"
                    displayTextLength={50}
                  />
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    메모를 추가하려면 클릭하세요
                  </p>
                )}
              </div>
              <div className="shrink-0 opacity-0 transition-opacity group-hover/memo:opacity-100">
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  편집
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 삭제 버튼 */}
      {/* {onDelete && (
        <button
          type="button"
          aria-label="페어 삭제"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-1/2 bottom-0 z-10 flex h-6 w-6 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-red-100 text-red-400 transition-all hover:bg-red-200 hover:text-red-600 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900/70 dark:hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )} */}
    </div>
  );
};

export default PairCard;
