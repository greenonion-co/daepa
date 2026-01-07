import {
  pairControllerGetPairList,
  layingControllerUpdate,
  MatingByDateDto,
  PetSummaryLayingDto,
} from "@repo/api-client";
import { overlay } from "overlay-kit";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { orderBy } from "es-toolkit";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreateLayingModal from "./CreateLayingModal";

import LayingItem from "./LayingItem";
import { DateTime } from "luxon";
import CalendarSelect from "./CalendarSelect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { TUTORIAL_TARGETS } from "./MatingDetailDialogTutorial";
import TutorialMockLayingItem from "./TutorialMockLayingItem";

interface MatingItemProps {
  mating: MatingByDateDto;
  father?: PetSummaryLayingDto;
  mother?: PetSummaryLayingDto;
  initialLayingId?: number | null;
  showTutorial?: boolean;
}

const MatingItem = ({ mating, father, mother, initialLayingId, showTutorial }: MatingItemProps) => {
  const queryClient = useQueryClient();
  const isEditable = !father?.isDeleted && !mother?.isDeleted;

  const { mutateAsync: updateLayingDate } = useMutation({
    mutationFn: ({ id, newLayingDate }: { id: number; newLayingDate: string }) =>
      layingControllerUpdate(id, { layingDate: newLayingDate }),
  });

  const layingDates = useMemo(
    () => mating.layingsByDate?.map((laying) => laying.layingDate) ?? [],
    [mating.layingsByDate],
  );

  const sortedLayingsByDate = useMemo(() => {
    if (!mating.layingsByDate) return [];
    return orderBy(
      mating.layingsByDate,
      [(laying) => DateTime.fromFormat(laying.layingDate, "yyyy-MM-dd").toMillis()],
      ["desc"], // 최근 날짜가 맨 앞에 오도록 내림차순 정렬
    );
  }, [mating.layingsByDate]);

  const [selectedLayingId, setSelectedLayingId] = useState<number | null>(
    sortedLayingsByDate[0]?.layingId ?? null,
  );
  const layingRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevLayingCountRef = useRef<number>(sortedLayingsByDate.length);
  const prevMatingIdRef = useRef<number>(mating.id);

  const scrollToLaying = useCallback((layingId: number) => {
    const element = layingRefs.current.get(layingId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setSelectedLayingId(layingId);
    }
  }, []);

  // 새로운 산란이 추가되면 해당 차수로 자동 포커스
  useEffect(() => {
    const currentCount = sortedLayingsByDate.length;

    // 산란이 추가되었을 때 (개수가 증가했을 때)
    if (currentCount > prevLayingCountRef.current && currentCount > 0) {
      // 가장 최근 날짜의 laying (첫 번째 요소, 내림차순 정렬이므로)으로 스크롤
      const latestLaying = sortedLayingsByDate[0];
      if (latestLaying) {
        // 약간의 지연을 주어 DOM이 렌더링된 후 스크롤
        setTimeout(() => {
          scrollToLaying(latestLaying.layingId);
        }, 100);
      }
    }

    prevLayingCountRef.current = currentCount;
  }, [sortedLayingsByDate, scrollToLaying]);

  // 시즌이 변경되면 첫 번째 차수로 자동 포커스
  useEffect(() => {
    // mating.id가 변경되었을 때 (시즌 변경)
    if (
      prevMatingIdRef.current !== mating.id &&
      sortedLayingsByDate.length > 0 &&
      sortedLayingsByDate[0]
    ) {
      const firstLaying = sortedLayingsByDate[0];
      // 약간의 지연을 주어 DOM이 렌더링된 후 스크롤
      setTimeout(() => {
        scrollToLaying(firstLaying.layingId);
      }, 100);
    }

    prevMatingIdRef.current = mating.id;
  }, [mating.id, scrollToLaying, sortedLayingsByDate]);

  // initialLayingId가 제공되면 해당 산란으로 스크롤
  useEffect(() => {
    if (initialLayingId && sortedLayingsByDate.length > 0) {
      const layingExists = sortedLayingsByDate.some((l) => l.layingId === initialLayingId);
      if (layingExists) {
        setTimeout(() => {
          scrollToLaying(initialLayingId);
        }, 100);
      }
    }
  }, [initialLayingId, sortedLayingsByDate, scrollToLaying]);

  const handleAddLayingClick = () => {
    overlay.open(({ isOpen, close }) => (
      <CreateLayingModal
        isOpen={isOpen}
        onClose={close}
        matingId={mating.id}
        matingDate={mating.matingDate}
        layingData={mating.layingsByDate}
        fatherId={father?.petId}
        motherId={mother?.petId}
      />
    ));
  };

  const getDisabledDates = useCallback(
    (currentLayingDate: string) => {
      const currentDate = DateTime.fromFormat(currentLayingDate, "yyyy-MM-dd").startOf("day");
      const matingDateObj = mating.matingDate
        ? DateTime.fromFormat(mating.matingDate, "yyyy-MM-dd").startOf("day")
        : null;

      return (date: Date) => {
        const normalizedDate = DateTime.fromJSDate(date).startOf("day");

        // 현재 산란일 자체는 비활성화 (편집 모드에서 현재 날짜는 선택 불가)
        return (
          normalizedDate.toMillis() === currentDate.toMillis() ||
          (matingDateObj !== null && normalizedDate.toMillis() < matingDateObj.toMillis())
        );
      };
    },
    [mating.matingDate],
  );

  const handleUpdateLayingDate = useCallback(
    async (layingId: number, newLayingDate: string) => {
      try {
        await updateLayingDate({
          id: layingId,
          newLayingDate,
        });
        toast.success("산란일 수정에 성공했습니다.");
        await queryClient.invalidateQueries({ queryKey: [pairControllerGetPairList.name] });
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message ?? "산란일 수정에 실패했습니다.");
        } else {
          toast.error("산란일 수정에 실패했습니다.");
        }
      }
    },
    [updateLayingDate, queryClient],
  );

  return (
    <div className="relative flex h-[calc(100vh-300px)] w-full flex-col">
      <div className="flex flex-col justify-center gap-1">
        <div
          data-tutorial={TUTORIAL_TARGETS.CLUTCH_TABS}
          className="dark:bg-background sticky top-0 z-20 flex items-center gap-1 overflow-x-auto bg-white pb-2"
        >
          {isEditable && (
            <button
              type="button"
              onClick={handleAddLayingClick}
              className="flex w-fit shrink-0 items-center gap-1 rounded-lg bg-blue-100 px-2 py-0.5 text-[14px] text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            >
              {sortedLayingsByDate.length === 0 && "산란 추가 "}+
            </button>
          )}
          {sortedLayingsByDate && sortedLayingsByDate.length > 0 ? (
            <div className="flex gap-1">
              {sortedLayingsByDate.map((layingData) => (
                <button
                  key={layingData.layingId}
                  type="button"
                  onClick={() => scrollToLaying(layingData.layingId)}
                  className={cn(
                    "shrink-0 rounded-lg px-2 py-0.5 text-[14px] font-medium transition-colors",
                    selectedLayingId === layingData.layingId
                      ? "bg-black font-[700] text-white dark:bg-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
                  )}
                >
                  {layingData.layings[0]?.clutch}차
                </button>
              ))}
            </div>
          ) : (
            // 튜토리얼용 가짜 차수 탭
            showTutorial && (
              <div className="flex gap-1">
                <div className="shrink-0 rounded-lg bg-black px-2 py-0.5 text-[14px] font-[700] text-white dark:bg-blue-700">
                  1차
                </div>
                <div className="shrink-0 rounded-lg bg-gray-100 px-2 py-0.5 text-[14px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  2차
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <ScrollArea className="relative flex h-[calc(100vh-350px)] w-full flex-col px-2">
        {sortedLayingsByDate && sortedLayingsByDate.length > 0 ? (
          sortedLayingsByDate.map((layingData) => (
            <div
              key={layingData.layingId}
              ref={(el) => {
                if (el) {
                  layingRefs.current.set(layingData.layingId, el);
                } else {
                  layingRefs.current.delete(layingData.layingId);
                }
              }}
              className="mb-7"
            >
              <div
                data-tutorial={
                  sortedLayingsByDate[0]?.layingId === layingData.layingId
                    ? TUTORIAL_TARGETS.LAYING_DATE
                    : undefined
                }
                className="dark:bg-background sticky top-0 mb-1 flex bg-white text-[15px] font-semibold text-gray-700 dark:text-gray-300"
              >
                <span className="mr-1 font-bold">{layingData.layings[0]?.clutch}차</span>

                <CalendarSelect
                  type="edit"
                  triggerTextClassName="text-gray-600 text-sm dark:text-gray-400"
                  disabledDates={layingDates}
                  triggerText={DateTime.fromFormat(layingData.layingDate, "yyyy-MM-dd").toFormat(
                    "M월 d일",
                  )}
                  confirmButtonText="산란 날짜 수정"
                  onConfirm={(newLayingDate) =>
                    handleUpdateLayingDate(layingData.layingId, newLayingDate)
                  }
                  disabled={getDisabledDates(layingData.layingDate)}
                />
              </div>
              <div
                className={cn(
                  selectedLayingId === layingData.layingId &&
                    "rounded-xl border-[1.5px] border-blue-200 shadow-md dark:border-blue-700",
                )}
              >
                <LayingItem
                  key={layingData.layingId}
                  layingData={layingData}
                  father={father}
                  mother={mother}
                  showTutorial={sortedLayingsByDate[0]?.layingId === layingData.layingId && showTutorial}
                />
              </div>
            </div>
          ))
        ) : showTutorial ? (
          <TutorialMockLayingItem />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center py-5 text-center text-[14px] text-gray-700 dark:text-gray-400">
            <Image src="/assets/lizard.png" alt="산란 데이터 없음" width={150} height={150} />
            산란된 알이 없습니다.
          </div>
        )}
        <div className="h-30" />
      </ScrollArea>
    </div>
  );
};

export default memo(MatingItem);
