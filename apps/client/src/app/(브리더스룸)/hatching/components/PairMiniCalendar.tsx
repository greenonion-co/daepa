"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MatingByDateDto, PetDtoEggStatus } from "@repo/api-client";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, getIncubationDays } from "@/lib/utils";

interface PairMiniCalendarProps {
  matingsByDate: MatingByDateDto[];
  onDateClick?: (matingId: number) => void;
}

enum EGG_STATUS {
  MATING = "mating",
  LAYING = "laying",
  HATCHING = "hatching",
  HATCHED = "hatched",
}

interface CalendarEvent {
  date: string; // yyyy-MM-dd
  type: EGG_STATUS;
  matingId: number;
}

const EVENT_COLORS = {
  mating: "bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200",
  laying: "bg-amber-200 text-amber-800 dark:bg-amber-600 dark:text-amber-200",
  hatching: "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200",
  hatched: "bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200",
};

const PairMiniCalendar = ({ matingsByDate, onDateClick }: PairMiniCalendarProps) => {
  // 모든 이벤트 날짜 추출
  const events = useMemo(() => {
    const eventList: CalendarEvent[] = [];

    matingsByDate?.forEach((mating) => {
      // 메이팅 날짜
      if (mating.matingDate) {
        eventList.push({
          date: mating.matingDate,
          type: EGG_STATUS.MATING,
          matingId: mating.id,
        });
      }

      // 산란 날짜 및 해칭 예정일
      mating.layingsByDate?.forEach((laying) => {
        if (laying.layingDate) {
          eventList.push({
            date: laying.layingDate,
            type: EGG_STATUS.LAYING,
            matingId: mating.id,
          });

          // 유정란이 있는 경우 해칭 예정일 계산
          const hasFertilizedEggs = laying.layings?.some(
            (egg) => egg.eggStatus === PetDtoEggStatus.FERTILIZED,
          );

          if (hasFertilizedEggs) {
            const incubationDays = getIncubationDays(laying.layings[0]?.temperature); // 기본 25도
            const hatchingDate = DateTime.fromFormat(laying.layingDate, "yyyy-MM-dd")
              .plus({ days: incubationDays })
              .toFormat("yyyy-MM-dd");

            eventList.push({
              date: hatchingDate,
              type: EGG_STATUS.HATCHING,
              matingId: mating.id,
            });
          }

          // 해칭 완료된 알의 실제 해칭일 표시
          laying.layings?.forEach((egg) => {
            if (egg.eggStatus === PetDtoEggStatus.HATCHED && egg.hatchingDate) {
              const hatchedDate = DateTime.fromISO(egg.hatchingDate).toFormat("yyyy-MM-dd");

              eventList.push({
                date: hatchedDate,
                type: EGG_STATUS.HATCHED,
                matingId: mating.id,
              });
            }
          });
        }
      });
    });

    return eventList;
  }, [matingsByDate]);

  // 날짜별 이벤트 맵
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { types: Set<EGG_STATUS>; matingId: number }>();
    events.forEach((event) => {
      if (!map.has(event.date)) {
        map.set(event.date, { types: new Set(), matingId: event.matingId });
      }
      map.get(event.date)?.types.add(event.type);
    });
    return map;
  }, [events]);

  // 날짜 범위 계산 (첫 메이팅일 ~ 마지막 해칭예정일)
  const dateRange = useMemo(() => {
    if (events.length === 0) return null;

    const dates = events.map((e) => DateTime.fromFormat(e.date, "yyyy-MM-dd"));
    const minDate = DateTime.min(...dates);
    const maxDate = DateTime.max(...dates);

    return { start: minDate, end: maxDate };
  }, [events]);

  // 현재 표시할 월 (마지막 달부터 시작)
  const [currentMonth, setCurrentMonth] = useState<DateTime>(DateTime.now().startOf("month"));
  const isInitialized = useRef(false);

  // dateRange가 계산되면 마지막 달로 이동
  useEffect(() => {
    if (dateRange?.end && !isInitialized.current) {
      setCurrentMonth(dateRange.end.startOf("month"));
      isInitialized.current = true;
    }
  }, [dateRange?.end]);

  // 이전/다음 월 이동 가능 여부
  const canGoPrev = dateRange?.start ? currentMonth > dateRange.start.startOf("month") : false;
  const canGoNext = dateRange?.end ? currentMonth < dateRange.end.startOf("month") : false;

  // 현재 월의 달력 데이터 생성
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startOfWeek = startOfMonth.startOf("week"); // 월요일 시작
    const endOfWeek = endOfMonth.endOf("week");

    const days: DateTime[] = [];
    let day = startOfWeek;

    while (day <= endOfWeek) {
      days.push(day);
      day = day.plus({ days: 1 });
    }

    return days;
  }, [currentMonth]);

  if (!dateRange || events.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-gray-500 dark:text-gray-400">
        메이팅 정보가 없습니다.
      </div>
    );
  }

  const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="flex flex-col gap-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {currentMonth.toFormat("yyyy년 M월")}
          </span>
          {/* 범례 */}
          <div className="flex flex-wrap justify-center gap-2 pt-1 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-300" />
              <span className="text-gray-700 dark:text-gray-400">메이팅</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="text-gray-700 dark:text-gray-400">산란</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
              <span className="text-gray-700 dark:text-gray-400">해칭예정</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-300" />
              <span className="text-gray-700 dark:text-gray-400">해칭완료</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentMonth((prev) => prev.minus({ months: 1 }))}
            disabled={!canGoPrev}
            className={cn(
              "rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700",
              !canGoPrev && "cursor-not-allowed opacity-30",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth((prev) => prev.plus({ months: 1 }))}
            disabled={!canGoNext}
            className={cn(
              "rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700",
              !canGoNext && "cursor-not-allowed opacity-30",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 달력 테이블 */}
      <div className="overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-[10px] text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {weekdays.map((day) => (
            <div key={day} className="py-1.5">
              {day}
            </div>
          ))}
        </div>

        {/* 달력 그리드 */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dateKey = day.toFormat("yyyy-MM-dd");
            const eventTypes = eventsByDate.get(dateKey);
            const isCurrentMonth = day.month === currentMonth.month;
            const isToday = day.hasSame(DateTime.now(), "day");

            // 이벤트 타입에 따른 배경색 결정
            let bgClass = "";
            if (eventTypes) {
              if (eventTypes.types.size === 1) {
                const type = Array.from(eventTypes.types)[0];
                if (type) {
                  bgClass = EVENT_COLORS[type];
                }
              } else {
                // 여러 이벤트가 겹치는 경우 그라데이션
                const hasHatched = eventTypes.types.has(EGG_STATUS.HATCHED);
                bgClass = hasHatched
                  ? "bg-gradient-to-br from-blue-300 via-amber-300 to-purple-300 dark:from-blue-800 dark:via-amber-600 dark:to-purple-800"
                  : "bg-gradient-to-br from-blue-200 via-amber-200 to-green-200 dark:from-blue-800 dark:via-amber-700 dark:to-green-800";
              }
            }

            const hasEvent = !!eventTypes;

            return (
              <div
                key={dateKey}
                onClick={(e) => {
                  if (hasEvent && eventTypes?.matingId && onDateClick) {
                    e.stopPropagation();
                    onDateClick(eventTypes.matingId);
                  }
                }}
                className={cn(
                  "flex h-7 w-full items-center justify-center border-b border-r border-gray-100 text-[11px] dark:border-gray-700",
                  !isCurrentMonth && "cursor-not-allowed text-gray-200 dark:text-gray-600",
                  isCurrentMonth &&
                    !eventTypes &&
                    "cursor-not-allowed text-gray-400 dark:text-gray-500",
                  isToday && "font-bold ring-1 ring-inset ring-gray-400",
                  hasEvent && "cursor-pointer font-[500] hover:opacity-80",
                  bgClass,
                )}
              >
                {day.day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PairMiniCalendar;
