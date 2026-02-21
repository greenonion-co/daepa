"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  feedingControllerGetList,
  feedingControllerCreate,
  feedingControllerUpdate,
  feedingControllerDelete,
  CreateFeedingDto,
  UpdateFeedingDto,
} from "@repo/api-client";
import { AxiosError } from "axios";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FormMultiSelect from "@/app/(브리더스룸)/components/FormMultiSelect";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import { SELECTOR_CONFIGS } from "@/app/(브리더스룸)/constants";

import type { FeedingRecord } from "../data";

// --- Types ---

interface FeedingInfoContentProps {
  petId: string;
  ownerId: string;
  initialFeedings?: FeedingRecord[];
  defaultFoods?: string[];
}

interface CalendarDayCellProps {
  day: DateTime;
  dateKey: string;
  feeding: FeedingRecord | undefined;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  isMyPet: boolean;
  onDateClick: (dateKey: string, feeding: FeedingRecord | undefined) => void;
}

// --- Memoized Day Cell ---

const CalendarDayCell = memo(function CalendarDayCell({
  day,
  dateKey,
  feeding,
  isCurrentMonth,
  isToday,
  isFuture,
  isMyPet,
  onDateClick,
}: CalendarDayCellProps) {
  const hasFed = !!feeding;
  const isDisabled = !isCurrentMonth || isFuture;
  const isClickable = !isDisabled && (hasFed || isMyPet);

  const handleClick = useCallback(() => {
    if (!isClickable) return;
    onDateClick(dateKey, feeding);
  }, [isClickable, dateKey, feeding, onDateClick]);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex h-8 w-full flex-col items-center justify-center border-r border-b border-gray-100 text-[11px] dark:border-gray-700",
        isDisabled && "text-gray-200 dark:text-gray-600",
        !isDisabled && !hasFed && "text-gray-800 dark:text-gray-500",
        isToday && "font-bold ring-1 ring-gray-400 ring-inset",
        hasFed &&
          !isFuture &&
          "bg-blue-200 font-[500] text-blue-800 dark:bg-blue-200 dark:text-blue-800",
        isClickable && "cursor-pointer hover:opacity-80",
      )}
    >
      <span>{day.day}</span>
      {hasFed && !isFuture && <div className="h-1 w-1 rounded-full bg-blue-600" />}
    </div>
  );
});

// --- Feeding Modal ---

interface FeedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  date: string; // yyyy-MM-dd
  feeding: FeedingRecord | undefined;
  defaultFoods?: string[];
  onSuccess: () => void;
}

function FeedingModal({
  isOpen,
  onClose,
  petId,
  date,
  feeding,
  defaultFoods,
  onSuccess,
}: FeedingModalProps) {
  const isEdit = !!feeding;

  const [foods, setFoods] = useState<string[] | undefined>(feeding?.foods ?? defaultFoods);
  const [amount, setAmount] = useState(feeding?.amount?.toString() ?? "");
  const [feedingMemo, setFeedingMemo] = useState(feeding?.memo ?? "");
  const [isProcessing, setIsProcessing] = useState(false);

  const { mutateAsync: createFeeding } = useMutation({
    mutationFn: (dto: CreateFeedingDto) => feedingControllerCreate(dto),
  });

  const { mutateAsync: updateFeeding } = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateFeedingDto }) =>
      feedingControllerUpdate(id, dto),
  });

  const { mutateAsync: deleteFeeding } = useMutation({
    mutationFn: (id: number) => feedingControllerDelete(id),
  });

  const handleSave = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (isEdit && feeding) {
        await updateFeeding({
          id: feeding.id,
          dto: {
            foods: foods?.length ? foods : undefined,
            amount: amount ? Number(amount) : undefined,
            memo: feedingMemo || undefined,
          },
        });
        toast.success("피딩 기록이 수정되었습니다.");
      } else {
        await createFeeding({
          petId,
          feedingAt: date,
          foods: foods?.length ? foods : undefined,
          amount: amount ? Number(amount) : undefined,
          memo: feedingMemo || undefined,
        });
        toast.success("피딩 기록이 추가되었습니다.");
      }
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "피딩 기록 저장에 실패했습니다.");
      } else {
        toast.error("피딩 기록 저장에 실패했습니다.");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    isEdit,
    feeding,
    foods,
    amount,
    feedingMemo,
    petId,
    date,
    createFeeding,
    updateFeeding,
    onSuccess,
    onClose,
  ]);

  const handleDelete = useCallback(async () => {
    if (!feeding) return;
    setIsProcessing(true);
    try {
      await deleteFeeding(feeding.id);
      toast.success("피딩 기록이 삭제되었습니다.");
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "피딩 기록 삭제에 실패했습니다.");
      } else {
        toast.error("피딩 기록 삭제에 실패했습니다.");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [feeding, deleteFeeding, onSuccess, onClose]);

  const displayDate = useMemo(
    () => DateTime.fromFormat(date, "yyyy-MM-dd").toFormat("M월 d일"),
    [date],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl p-4 sm:max-w-[360px] dark:bg-neutral-900">
        <DialogTitle className="text-base font-semibold">
          {displayDate} {isEdit ? "피딩 기록 수정" : "피딩 기록 추가"}
        </DialogTitle>

        <div className="flex flex-col gap-3">
          <div className="flex w-fit flex-col gap-1">
            <label className="text-[13px] font-[500] text-gray-600 dark:text-gray-400">먹이</label>
            <FormMultiSelect
              title="먹이"
              displayMap={Object.fromEntries(
                SELECTOR_CONFIGS.foods.selectList.map(({ key, value }) => [key, value]),
              )}
              initialItems={foods}
              onSelect={(items) => setFoods(items)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-[500] text-gray-600 dark:text-gray-400">
              급여량
            </label>
            <NumberField
              value={amount}
              setValue={(value) => setAmount(value.value)}
              placeholder="예: 1.5"
              stepAmount={0.1}
              min={0}
              inputClassName="h-[32px] w-full rounded-md border border-gray-200 p-2 text-sm font-[500] placeholder:font-[500] dark:border-gray-700"
              field={{ name: "weight", type: "number", unit: "개" }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-[500] text-gray-600 dark:text-gray-400">메모</label>
            <textarea
              value={feedingMemo}
              onChange={(e) => setFeedingMemo(e.target.value)}
              placeholder="메모를 입력하세요"
              maxLength={500}
              rows={2}
              className="min-h-[60px] resize-none rounded-md border border-gray-200 p-2 text-sm font-[500] placeholder:font-[500] focus:outline-none dark:border-gray-700 dark:bg-transparent dark:text-gray-200"
            />
          </div>

          <div className="flex gap-2">
            {isEdit && (
              <Button
                variant="outline"
                disabled={isProcessing}
                onClick={handleDelete}
                className="h-10 flex-1 cursor-pointer rounded-xl text-red-500 hover:text-red-600"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                삭제
              </Button>
            )}
            <Button
              disabled={isProcessing}
              onClick={handleSave}
              className="h-10 flex-1 cursor-pointer rounded-xl bg-blue-500 font-bold text-white hover:bg-blue-600"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEdit ? (
                "수정"
              ) : (
                "추가"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Component ---

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

const FeedingInfoContent = ({
  petId,
  ownerId,
  initialFeedings,
  defaultFoods,
}: FeedingInfoContentProps) => {
  const isMyPet = useIsMyPet(ownerId);
  // const queryClient = useQueryClient();

  const initialMonth = useMemo(() => DateTime.now().startOf("month"), []);
  const [currentMonth, setCurrentMonth] = useState<DateTime>(initialMonth);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    date: string;
    feeding: FeedingRecord | undefined;
  }>({ isOpen: false, date: "", feeding: undefined });

  // 현재 월의 시작/종료일 계산
  const dateRange = useMemo(() => {
    const start = currentMonth.startOf("month").toFormat("yyyy-MM-dd");
    const end = currentMonth.endOf("month").toFormat("yyyy-MM-dd");
    return { start, end };
  }, [currentMonth]);

  // 초기 데이터가 있는 달인지 확인
  const isInitialMonth = useMemo(
    () => currentMonth.hasSame(initialMonth, "month"),
    [currentMonth, initialMonth],
  );

  // 피딩 목록 조회 (초기 데이터가 있으면 현재 달은 자동 fetch 하지 않음)
  const { data: queryFeedingList, refetch } = useQuery({
    queryKey: [feedingControllerGetList.name, petId, dateRange.start, dateRange.end],
    queryFn: () =>
      feedingControllerGetList({
        petId,
        startDate: dateRange.start,
        endDate: dateRange.end,
        itemPerPage: 31,
      }),
    select: (response) => response.data.data,
    enabled: !(isInitialMonth && !!initialFeedings),
  });

  // 서버에서 받은 초기 데이터 또는 React Query 데이터 사용
  const feedingList = queryFeedingList ?? (isInitialMonth ? initialFeedings : undefined);

  // 날짜별 피딩 맵
  const feedingByDate = useMemo(() => {
    const map = new Map<string, FeedingRecord>();
    feedingList?.forEach((feeding) => {
      const dateKey = feeding.feedingAt.slice(0, 10);
      map.set(dateKey, feeding);
    });
    return map;
  }, [feedingList]);

  // 달력 날짜 배열
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startOfWeek = startOfMonth.startOf("week");
    const endOfWeek = endOfMonth.endOf("week");

    const days: DateTime[] = [];
    let day = startOfWeek;
    while (day <= endOfWeek) {
      days.push(day);
      day = day.plus({ days: 1 });
    }
    return days;
  }, [currentMonth]);

  const today = useMemo(() => DateTime.now().startOf("day"), []);

  // 달력 데이터 결합
  const calendarDaysWithFeedings = useMemo(
    () =>
      calendarDays.map((day) => {
        const dateKey = day.toFormat("yyyy-MM-dd");
        return {
          day,
          dateKey,
          feeding: feedingByDate.get(dateKey),
          isCurrentMonth: day.month === currentMonth.month,
          isToday: day.hasSame(today, "day"),
          isFuture: day > today,
        };
      }),
    [calendarDays, feedingByDate, currentMonth.month, today],
  );

  // 이번 달 피딩 카운트
  const feedingCount = useMemo(() => feedingList?.length ?? 0, [feedingList]);

  const handleDateClick = useCallback((dateKey: string, feeding: FeedingRecord | undefined) => {
    setModalState({ isOpen: true, date: dateKey, feeding });
  }, []);

  const handleModalClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleMutationSuccess = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => prev.minus({ months: 1 }));
  }, []);

  // 현재 달이 오늘 달이면 다음 달로 이동 불가
  const isCurrentMonthNow = useMemo(
    () => currentMonth.hasSame(today, "month"),
    [currentMonth, today],
  );

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const next = prev.plus({ months: 1 });
      if (next > today.startOf("month")) return prev;
      return next;
    });
  }, [today]);

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 shadow-xs dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">피딩 정보</span>
        <span className="text-xs font-bold text-blue-600 dark:text-gray-400">
          이번 달 {feedingCount}회
        </span>
      </div>

      {/* 캘린더 */}
      <div className="flex flex-col gap-2">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">
              {currentMonth.toFormat("yyyy년 M월")}
            </span>
            {/* 범례 */}
            <div className="flex items-center gap-1 text-[10px]">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-300" />
              <span className="text-gray-700 dark:text-gray-400">피딩 완료</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="cursor-pointer rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={isCurrentMonthNow}
              className={cn(
                "rounded-lg p-1",
                isCurrentMonthNow
                  ? "cursor-not-allowed text-gray-300 dark:text-gray-600"
                  : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4",
                  isCurrentMonthNow
                    ? "text-gray-300 dark:text-gray-600"
                    : "text-gray-600 dark:text-gray-400",
                )}
              />
            </button>
          </div>
        </div>

        {/* 달력 테이블 */}
        <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-[10px] text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1.5">
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7">
            {calendarDaysWithFeedings.map(
              ({ day, dateKey, feeding, isCurrentMonth, isToday, isFuture }) => (
                <CalendarDayCell
                  key={dateKey}
                  day={day}
                  dateKey={dateKey}
                  feeding={feeding}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday}
                  isFuture={isFuture}
                  isMyPet={isMyPet}
                  onDateClick={handleDateClick}
                />
              ),
            )}
          </div>
        </div>
      </div>

      {/* 피딩 모달 */}
      {modalState.isOpen && (
        <FeedingModal
          isOpen={modalState.isOpen}
          onClose={handleModalClose}
          petId={petId}
          date={modalState.date}
          feeding={modalState.feeding}
          defaultFoods={defaultFoods}
          onSuccess={handleMutationSuccess}
        />
      )}
    </div>
  );
};

export default FeedingInfoContent;
