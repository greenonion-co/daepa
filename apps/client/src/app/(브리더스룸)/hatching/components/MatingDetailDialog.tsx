import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CalendarSelect from "./CalendarSelect";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MatingByDateDto, MatingByParentsDto } from "@repo/api-client";
import { cn } from "@/lib/utils";
import { compact } from "es-toolkit";
import MatingItem from "./MatingItem";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useMobile";
import { DateTime } from "luxon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Pencil, AlertCircle, HelpCircle } from "lucide-react";
import { overlay } from "overlay-kit";
import EditMatingModal from "./EditMatingModal";
import DeleteMatingModal from "./DeleteMatingModal";
import {
  MatingDetailDialogTutorialOverlay,
  useMatingDetailDialogTutorial,
  TUTORIAL_TARGETS,
} from "./MatingDetailDialogTutorial";

interface MatingDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matingGroup: MatingByParentsDto | null;
  onConfirmAdd: (matingDate: string) => void;
  initialMatingId?: number | null;
  initialLayingId?: number | null;
}

const MatingDetailDialog = ({
  isOpen,
  onClose,
  matingGroup,
  onConfirmAdd,
  initialMatingId,
  initialLayingId,
}: MatingDetailDialogProps) => {
  const isMobile = useIsMobile();
  const isEditable = !matingGroup?.father?.isDeleted && !matingGroup?.mother?.isDeleted;
  const { showTutorial, openTutorial, closeTutorial } = useMatingDetailDialogTutorial(isOpen);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  // 메이팅 날짜들을 추출하여 Calendar용 날짜 배열 생성
  const getMatingDates = useCallback((matingDates: MatingByDateDto[]) => {
    if (!matingDates) return [];

    return compact(matingDates.map((mating) => mating.matingDate));
  }, []);

  const matingDates = useMemo(
    () => getMatingDates(matingGroup?.matingsByDate ?? []),
    [matingGroup?.matingsByDate, getMatingDates],
  );

  const [selectedMatingId, setSelectedMatingId] = useState<number | null>(null);
  const prevMatingIdsRef = useRef<Set<number>>(new Set());
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!matingGroup?.matingsByDate) return;

    const currentIds = new Set(matingGroup.matingsByDate.map((m) => m.id));

    // 다이얼로그가 열릴 때 초기화
    if (isOpen && !isInitializedRef.current) {
      isInitializedRef.current = true;
      prevMatingIdsRef.current = currentIds;

      // initialMatingId가 있으면 해당 메이팅으로 포커스
      if (initialMatingId) {
        const matingExists = matingGroup.matingsByDate.some((m) => m.id === initialMatingId);
        if (matingExists) {
          setSelectedMatingId(initialMatingId);
          return;
        }
      }
      // 기본값: 첫 번째 메이팅 선택
      if (matingGroup.matingsByDate[0]) {
        setSelectedMatingId(matingGroup.matingsByDate[0].id);
      }
      return;
    }

    // 새로운 메이팅이 추가되었을 때 (이전에 없던 ID 찾기)
    const newMatingId = matingGroup.matingsByDate.find(
      (m) => !prevMatingIdsRef.current.has(m.id),
    )?.id;

    if (newMatingId) {
      setSelectedMatingId(newMatingId);
    }
    // 선택된 메이팅이 삭제되었을 때 다음 시즌으로 포커스
    else if (selectedMatingId && !currentIds.has(selectedMatingId)) {
      // 이전 배열에서 삭제된 메이팅의 인덱스 찾기
      const prevMatingIds = Array.from(prevMatingIdsRef.current);
      const deletedIndex = prevMatingIds.indexOf(selectedMatingId);

      // 현재 배열에서 같은 인덱스 또는 마지막 요소 선택
      const nextIndex = Math.min(deletedIndex, matingGroup.matingsByDate.length - 1);
      if (nextIndex >= 0 && matingGroup.matingsByDate[nextIndex]) {
        setSelectedMatingId(matingGroup.matingsByDate[nextIndex].id);
      } else if (matingGroup.matingsByDate[0]) {
        setSelectedMatingId(matingGroup.matingsByDate[0].id);
      } else {
        setSelectedMatingId(null);
      }
    }

    prevMatingIdsRef.current = currentIds;
  }, [isOpen, initialMatingId, matingGroup?.matingsByDate, selectedMatingId]);

  // 다이얼로그가 닫힐 때 초기화 상태 리셋
  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      prevMatingIdsRef.current = new Set();
    }
  }, [isOpen]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedMatingId) return;

    const selectedMating = matingGroup?.matingsByDate.find((m) => m.id === selectedMatingId);
    if (!selectedMating) return;

    overlay.open(({ isOpen, close }) => (
      <EditMatingModal
        isOpen={isOpen}
        onClose={close}
        matingId={selectedMating.id}
        currentData={{
          fatherId: matingGroup?.father?.petId,
          motherId: matingGroup?.mother?.petId,
          matingDate: selectedMating.matingDate ?? "",
        }}
        matingDates={matingDates}
      />
    ));
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedMatingId) return;

    const selectedMating = matingGroup?.matingsByDate.find((m) => m.id === selectedMatingId);
    if (!selectedMating) return;

    overlay.open(({ isOpen, close }) => (
      <DeleteMatingModal
        isOpen={isOpen}
        onClose={close}
        matingId={selectedMating.id}
        matingDate={selectedMating.matingDate}
      />
    ));
  };

  if (!matingGroup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogContentRef}
        className={cn("p-13 flex w-full flex-col rounded-3xl sm:max-w-[860px]", isMobile && "p-4")}
      >
        {/* 튜토리얼 오버레이 */}
        {showTutorial && (
          <MatingDetailDialogTutorialOverlay
            onClose={closeTutorial}
            containerRef={dialogContentRef}
          />
        )}

        <DialogTitle className="flex flex-col gap-2">
          <div className={cn("flex items-center gap-1", isMobile && "pt-3")}>
            <div
              data-tutorial={TUTORIAL_TARGETS.PARENT_LINKS}
              className={cn("flex items-center gap-1 text-[28px]", isMobile && "text-[18px]")}
            >
              {matingGroup.father?.petId ? (
                matingGroup.father?.isDeleted ? (
                  <>
                    <span className="cursor-not-allowed line-through decoration-red-500">
                      {matingGroup.father?.name}
                    </span>
                    <span className="text-[12px] text-red-500">[삭제됨]</span>
                  </>
                ) : (
                  <Link
                    href={`/pet/${matingGroup.father?.petId}`}
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    {matingGroup.father?.name}
                  </Link>
                )
              ) : (
                <span className="text-[14px] font-[500] text-gray-500 dark:text-gray-400">
                  정보없음
                </span>
              )}
              <span>x</span>
              {matingGroup.mother?.petId ? (
                matingGroup.mother?.isDeleted ? (
                  <>
                    <span className="cursor-not-allowed line-through decoration-red-500">
                      {matingGroup.mother?.name}
                    </span>
                    <span className="text-[12px] text-red-500">[삭제됨]</span>
                  </>
                ) : (
                  <Link
                    href={`/pet/${matingGroup.mother?.petId}`}
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    {matingGroup.mother?.name}
                  </Link>
                )
              ) : (
                <span className="text-[14px] font-[500] text-gray-500 dark:text-gray-400">
                  정보없음
                </span>
              )}
            </div>
            {/* 사용법 버튼 */}
            <button
              type="button"
              onClick={openTutorial}
              className="ml-2 flex h-6 items-center gap-0.5 rounded-lg px-1.5 text-[13px] text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/50"
            >
              <HelpCircle className="h-4 w-4" />
              <span>사용법</span>
            </button>
          </div>

          {!isEditable && (
            <div className="flex items-center gap-1 text-sm font-[500] text-red-600">
              <AlertCircle size={15} />부 또는 모가 삭제된 경우 산란을 추가할 수 없습니다.
            </div>
          )}
        </DialogTitle>

        <div className={cn("flex flex-col gap-2", isMobile && "px-0")}>
          {matingGroup.matingsByDate && matingGroup.matingsByDate.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* 메이팅 날짜 선택 Select */}
                  <div data-tutorial={TUTORIAL_TARGETS.SEASON_SELECT}>
                    <Select
                      value={String(selectedMatingId)}
                      onValueChange={(v) => setSelectedMatingId(Number(v))}
                    >
                      <SelectTrigger className="rounded-none border-0 border-b-[1.5px] border-b-gray-300 p-0 text-[18px] font-[600] dark:border-b-gray-600">
                        {selectedMatingId ? (
                          <div className="flex items-center gap-1 pl-1">
                            {(() => {
                              const selectedIndex = matingGroup.matingsByDate.findIndex(
                                (m) => m.id === selectedMatingId,
                              );
                              const season = matingGroup.matingsByDate.length - selectedIndex;
                              const selectedMating = matingGroup.matingsByDate[selectedIndex];

                              return (
                                <>
                                  <span className="rounded-lg bg-gray-100 p-1 px-2 text-[12px] text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                    {season}시즌
                                  </span>
                                  {selectedMating?.matingDate
                                    ? DateTime.fromFormat(
                                        selectedMating.matingDate,
                                        "yyyy-MM-dd",
                                      ).toFormat("M월 d일")
                                    : ""}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <SelectValue placeholder="메이팅 날짜 선택" />
                        )}
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {matingGroup.matingsByDate.map((mating) => (
                          <SelectItem
                            key={mating.id}
                            value={String(mating.id)}
                            className="rounded-xl text-[16px]"
                          >
                            {mating.matingDate
                              ? DateTime.fromFormat(mating.matingDate, "yyyy-MM-dd").toFormat(
                                  "M월 d일",
                                )
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 수정/삭제 버튼 */}
                  <div
                    data-tutorial={TUTORIAL_TARGETS.EDIT_DELETE_BUTTONS}
                    className="flex items-center gap-1"
                  >
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50"
                      aria-label="교배 정보 수정"
                      onClick={handleEditClick}
                    >
                      <Pencil className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </button>
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50"
                      aria-label="교배 정보 삭제"
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* 메이팅 추가 */}
                {isEditable && (
                  <div data-tutorial={TUTORIAL_TARGETS.ADD_MATING_BUTTON}>
                    <CalendarSelect
                      triggerText="메이팅 추가"
                      confirmButtonText="메이팅 추가"
                      disabledDates={matingDates}
                      onConfirm={(matingDate) => onConfirmAdd(matingDate)}
                    />
                  </div>
                )}
              </div>

              {/* 선택된 메이팅 아이템 */}
              {(() => {
                const selectedMating = matingGroup.matingsByDate.find(
                  (m) => m.id === selectedMatingId,
                );
                if (!selectedMating) return null;

                return (
                  <MatingItem
                    mating={selectedMating}
                    father={matingGroup.father}
                    mother={matingGroup.mother}
                    initialLayingId={initialLayingId}
                    showTutorial={showTutorial}
                  />
                );
              })()}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">메이팅이 없습니다.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatingDetailDialog;
