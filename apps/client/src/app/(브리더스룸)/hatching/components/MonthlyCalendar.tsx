"use client";

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from "@/components/common/Loading";

import { brPetControllerGetPetsByMonth, PetDto, PetDtoType } from "@repo/api-client";
import HatchingPetCard from "./HatchingPetCard";

import { Calendar } from "./Calendar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import { DateTime } from "luxon";

import { isNativeApp } from "@/lib/native-bridge";

const MonthlyCalendar = memo(() => {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isScrolled, setIsScrolled] = useState(false);

  const [tab, setTab] = useState<"all" | PetDtoType>("all");

  // 탭 인디케이터를 위한 refs와 state
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const allBtnRef = useRef<HTMLButtonElement>(null);
  const eggBtnRef = useRef<HTMLButtonElement>(null);
  const petBtnRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const container = tabContainerRef.current;
    let activeBtn: HTMLButtonElement | null = null;

    if (tab === "all") {
      activeBtn = allBtnRef.current;
    } else if (tab === PetDtoType.EGG) {
      activeBtn = eggBtnRef.current;
    } else {
      activeBtn = petBtnRef.current;
    }

    if (container && activeBtn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [tab]);

  // 월별 해칭된 펫 조회
  const { data: monthlyData, isPending: monthlyIsPending } = useQuery({
    queryKey: [
      brPetControllerGetPetsByMonth.name,
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
    ],
    queryFn: () =>
      brPetControllerGetPetsByMonth({
        year: currentMonth.getFullYear().toString(),
        month: (currentMonth.getMonth() + 1).toString(),
      }),
    select: (data) => data.data.data,
  });

  const todayIsFetching = false;

  // 월별 해칭된 펫 개수 계산
  const petCounts = useMemo(() => {
    if (!monthlyData) return {};

    return Object.entries(monthlyData).reduce(
      (acc, [date, pets]) => {
        // 현재 탭에 맞는 펫만 필터링
        const filteredPets = tab === "all" ? pets : pets.filter((pet) => pet.type === tab);

        const hatched = filteredPets.filter((pet) => pet.type === PetDtoType.PET).length;
        const egg = filteredPets.filter((pet) => pet.type === PetDtoType.EGG).length;

        acc[date] = {
          hatched,
          egg,
          total: filteredPets.length,
        };
        return acc;
      },
      {} as Record<string, { hatched: number; egg: number; total: number }>,
    );
  }, [monthlyData, tab]);

  const visibleData = useMemo(() => (monthlyData ?? {}) as Record<string, PetDto[]>, [monthlyData]);
  const sortedEntries = useMemo(() => {
    const entries = Object.entries(visibleData as Record<string, PetDto[]>);
    entries.sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
    return entries as Array<[string, PetDto[]]>;
  }, [visibleData]);

  // 주차별 그룹 생성
  const weeklyGroups = useMemo(() => {
    const groups: Array<{ weekKey: string; label: string; items: Array<[string, PetDto[]]> }> = [];
    let currentKey: string | null = null;
    for (const [date, pets] of sortedEntries) {
      const dt = DateTime.fromISO(date);
      // 주차 계산 (월요일 시작 기준)
      const firstDayOfMonth = dt.startOf("month");
      const week = Math.ceil((dt.day + firstDayOfMonth.weekday - 1) / 7);
      const label = `${dt.toFormat("MM")}월 ${week}주차`;
      const key = `${dt.toFormat("yyyy-MM")}-w${week}`;
      if (key !== currentKey) {
        groups.push({ weekKey: key, label, items: [] });
        currentKey = key;
      }
      if (groups[groups.length - 1]) {
        groups[groups.length - 1]?.items.push([date, pets]);
      }
    }
    return groups;
  }, [sortedEntries]);

  // 스크롤 이벤트 감지
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      setIsScrolled(scrollTop > 5);
    };

    // ScrollArea의 실제 스크롤 가능한 요소 찾기
    const scrollableElement = scrollArea.querySelector("[data-radix-scroll-area-viewport]");
    if (scrollableElement) {
      scrollableElement.addEventListener("scroll", handleScroll);
      return () => {
        scrollableElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  return (
    <div
      className={cn(
        "flex",
        isMobile && "h-[calc(100dvh-92px)] overflow-hidden pb-[env(safe-area-inset-bottom)]",
        isNativeApp() && "-mb-20",
      )}
    >
      {!isMobile && (
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            setSelectedDate(date);
          }}
          onMonthChange={(month) => setCurrentMonth(month)}
          eggCounts={petCounts}
        />
      )}

      <div className={cn("flex gap-4 px-2", isMobile ? "w-full flex-col" : "flex-1")}>
        {isMobile && (
          <div
            className={cn(
              "shrink-0 touch-none transition-all duration-300",
              isScrolled &&
                "dark:bg-background sticky top-0 z-20 [margin-bottom:-22%] w-full origin-top-left scale-75",
            )}
          >
            <Calendar
              mode="single"
              className="p-0 pb-2"
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) return;
                setSelectedDate(date);
              }}
              onMonthChange={(month) => setCurrentMonth(month)}
              eggCounts={petCounts}
            />
          </div>
        )}

        <div
          className={cn(
            "w-full",
            isMobile && "flex min-h-0 flex-1 flex-col",
            isMobile && (isScrolled ? "mt-2" : "-mt-5"),
          )}
        >
          <div
            ref={tabContainerRef}
            className="relative flex h-[32px] w-fit shrink-0 items-center gap-2 rounded-lg bg-gray-100 px-0.5 shadow-sm dark:bg-[#18171C]"
          >
            {/* 애니메이션 인디케이터 */}
            <div
              className="absolute rounded-lg bg-white shadow-sm transition-all duration-200 ease-out dark:bg-[#101012]"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                height: "calc(100% - 4px)",
                top: "2px",
              }}
            />
            <button
              ref={allBtnRef}
              onClick={() => setTab("all")}
              className={cn(
                "relative z-10 cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors duration-200",
                tab === "all"
                  ? "bg-white text-gray-800 dark:bg-transparent dark:text-gray-200"
                  : "text-gray-600 dark:text-gray-400",
              )}
            >
              전체
            </button>
            <button
              ref={eggBtnRef}
              onClick={() => setTab(PetDtoType.EGG)}
              className={cn(
                "relative z-10 cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors duration-200",
                tab === PetDtoType.EGG
                  ? "bg-white text-gray-800 dark:bg-transparent dark:text-gray-200"
                  : "text-gray-600 dark:text-gray-400",
              )}
            >
              알
            </button>
            <button
              ref={petBtnRef}
              onClick={() => setTab(PetDtoType.PET)}
              className={cn(
                "relative z-10 cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors duration-200",
                tab === PetDtoType.PET
                  ? "bg-white text-gray-800 dark:bg-transparent dark:text-gray-200"
                  : "text-gray-600 dark:text-gray-400",
              )}
            >
              해칭 완료
            </button>
          </div>

          <ScrollArea
            ref={scrollAreaRef}
            className={cn(
              "relative mt-1 [&>[data-radix-scroll-area-viewport]]:overscroll-contain",
              isMobile ? "min-h-0 flex-1" : "h-[calc(100vh-150px)]",
            )}
          >
            {monthlyIsPending || todayIsFetching ? (
              <Loading />
            ) : weeklyGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-10 text-sm text-gray-400 dark:text-gray-500">
                <span className="font-medium text-gray-500 dark:text-gray-400">
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                </span>
                아직 데이터가 없습니다.
              </div>
            ) : (
              <>
                {weeklyGroups.map((group) => (
                  <div
                    key={group.weekKey}
                    ref={(el) => void (groupRefs.current[group.weekKey] = el)}
                  >
                    <div className="dark:supports-[backdrop-filter]:bg-background/60 sticky top-0 bg-white/70 px-1 py-2 text-[15px] font-semibold supports-[backdrop-filter]:bg-white/80 dark:text-gray-100">
                      {group.label}
                    </div>
                    {group.items
                      .filter(([, pets]) => {
                        if (tab === "all") return pets.length > 0;
                        if (tab === PetDtoType.PET)
                          return pets.filter((pet) => pet.type === PetDtoType.PET).length > 0;
                        if (tab === PetDtoType.EGG)
                          return pets.filter((pet) => pet.type === PetDtoType.EGG).length > 0;
                      })
                      .map(([date, pets]) => {
                        const isSelected = selectedDate
                          ? DateTime.fromJSDate(selectedDate).hasSame(
                              DateTime.fromFormat(date, "yyyy-MM-dd"),
                              "day",
                            )
                          : false;

                        return (
                          <HatchingPetCard
                            key={date}
                            isSelected={isSelected}
                            date={date}
                            pets={pets}
                            tab={tab}
                          />
                        );
                      })}
                  </div>
                ))}

                <div className="h-20" />
              </>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
});

MonthlyCalendar.displayName = "MonthlyCalendar";

export default MonthlyCalendar;
