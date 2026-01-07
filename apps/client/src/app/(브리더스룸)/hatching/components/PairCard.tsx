import { MatingByParentsDto, PetDtoEggStatus } from "@repo/api-client";
import { StickyNote } from "lucide-react";
import { useRef } from "react";

import { updatePairProps } from "./PairList";
import ParentCard from "./ParentCard";
import TooltipText from "../../components/TooltipText";
import PairMiniCalendar, { CalendarEventDetail } from "./PairMiniCalendar";
import { PairCardTutorialOverlay, PAIR_CARD_TUTORIAL_TARGETS } from "./PairCardTutorial";

interface PairCardProps {
  pair: MatingByParentsDto;
  onClickUpdateDesc: (data: updatePairProps) => void;
  onClick: () => void;
  onDateClick?: (eventData: CalendarEventDetail) => void;
  onAddMating?: (date: string) => void;
  onAddLaying?: (date: string) => void;
  showTutorial?: boolean;
  onCloseTutorial?: () => void;
}

const PairCard = ({
  pair,
  onClick,
  onClickUpdateDesc,
  onDateClick,
  onAddMating,
  onAddLaying,
  showTutorial,
  onCloseTutorial,
}: PairCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

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
      className="group relative flex flex-col rounded-2xl border border-gray-200/50 bg-white p-2 shadow-lg transition-all hover:border-gray-300 hover:bg-gray-100/20 hover:shadow-xl dark:border-gray-700 dark:bg-neutral-800"
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
        <ParentCard parent={pair.father} />
        <ParentCard parent={pair.mother} />
      </div>

      {/* 미니 캘린더 */}
      <div data-tutorial={PAIR_CARD_TUTORIAL_TARGETS.MINI_CALENDAR}>
        <PairMiniCalendar
          matingsByDate={pair.matingsByDate ?? []}
          onDateClick={(eventData) => {
            onClick();
            onDateClick?.(eventData);
          }}
          onAddMating={onAddMating}
          onAddLaying={onAddLaying}
        />
      </div>

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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClickUpdateDesc({
            pairId: pair.pairId,
            desc: pair.desc,
          });
        }}
        className="group/memo relative mt-3 cursor-pointer rounded-lg border border-gray-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30 px-3 transition-all hover:border-orange-300 hover:shadow-md dark:border-gray-700 dark:from-neutral-800 dark:to-neutral-800"
      >
        <div className="flex items-center gap-2">
          <StickyNote className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="flex-1 py-3">
            {pair.desc ? (
              <TooltipText text={pair.desc} className="w-full text-sm" displayTextLength={50} />
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                메모를 추가하려면 클릭하세요
              </p>
            )}
          </div>
          <div className="flex-shrink-0 opacity-0 transition-opacity group-hover/memo:opacity-100">
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">편집</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PairCard;
