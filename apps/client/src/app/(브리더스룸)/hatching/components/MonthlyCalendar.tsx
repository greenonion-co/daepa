"use client";

import { memo, useMemo, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from "@/components/common/Loading";

import { brPetControllerGetPetsByMonth, PetDto, PetDtoType } from "@repo/api-client";
import HatchingPetCard from "./HatchingPetCard";

import { Calendar } from "./Calendar";
import { format, getWeekOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

const MonthlyCalendar = memo(() => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [tab, setTab] = useState<"all" | "hatched" | "egg">("all");

  // 월별 해칭된 펫 조회
  const { data: monthlyData, isPending: monthlyIsPending } = useQuery({
    queryKey: [
      brPetControllerGetPetsByMonth.name,
      (selectedDate ?? new Date()).getFullYear(),
      (selectedDate ?? new Date()).getMonth(),
    ],
    queryFn: () =>
      brPetControllerGetPetsByMonth({
        year: (selectedDate ?? new Date()).getFullYear().toString(),
        month: (selectedDate ?? new Date()).getMonth().toString(),
      }),
    select: (data) => data.data.data,
  });

  const todayIsFetching = false;

  // 월별 해칭된 펫 개수 계산
  const petCounts = useMemo(() => {
    if (!monthlyData) return {};

    return Object.entries(monthlyData).reduce(
      (acc, [date, pets]) => {
        const hatched = pets.filter((pet) => pet.type === PetDtoType.PET).length;
        const egg = pets.filter((pet) => pet.type === PetDtoType.EGG).length;

        acc[date] = {
          hatched,
          egg, // 해칭된 펫만 조회하므로 0
          total: pets.length,
        };
        return acc;
      },
      {} as Record<string, { hatched: number; egg: number; total: number }>,
    );
  }, [monthlyData]);

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
      const d = new Date(date);
      const week = getWeekOfMonth(d, { weekStartsOn: 1 });
      const label = `${format(d, "MM월 ")}${week}주차`;
      const key = `${format(d, "yyyy-MM")}-w${week}`;
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

  return (
    <div>
      <div className="flex gap-4 max-[700px]:flex-col">
        <Calendar
          mode="single"
          selected={selectedDate ? new Date(selectedDate) : undefined}
          onSelect={(date) => {
            if (!date) return;
            setSelectedDate(date);
          }}
          eggCounts={petCounts}
        />

        <div>
          <div className="flex h-[32px] w-fit items-center gap-2 rounded-lg bg-gray-100 px-1">
            <button
              onClick={() => setTab("all")}
              className={cn(
                "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800",
                tab === "all" ? "bg-white shadow-sm" : "text-gray-600",
              )}
            >
              전체
            </button>
            <button
              onClick={() => setTab("egg")}
              className={cn(
                "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800",
                tab === "egg" ? "bg-white shadow-sm" : "text-gray-600",
              )}
            >
              알
            </button>
            <button
              onClick={() => setTab("hatched")}
              className={cn(
                "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800",
                tab === "hatched" ? "bg-white shadow-sm" : "text-gray-600",
              )}
            >
              해칭 완료
            </button>
          </div>

          <ScrollArea className="relative flex h-[calc(100vh-150px)] w-full gap-2 p-2">
            {monthlyIsPending || todayIsFetching ? (
              <Loading />
            ) : (
              weeklyGroups.map((group) => (
                <div key={group.weekKey} ref={(el) => void (groupRefs.current[group.weekKey] = el)}>
                  <div className="sticky top-0 z-10 bg-white/70 px-1 py-2 text-[15px] font-semibold supports-[backdrop-filter]:bg-white/60">
                    {group.label}
                  </div>
                  {group.items
                    .filter(([, pets]) => {
                      if (tab === "all") return pets.length > 0;
                      if (tab === "hatched")
                        return pets.filter((pet) => pet.type === PetDtoType.PET).length > 0;
                      if (tab === "egg")
                        return pets.filter((pet) => pet.type === PetDtoType.EGG).length > 0;
                    })
                    .map(([date, pets]) => {
                      const isSelected =
                        new Date(selectedDate ?? "").toLocaleDateString() ===
                        new Date(date).toLocaleDateString();

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
              ))
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
});

MonthlyCalendar.displayName = "MonthlyCalendar";

export default MonthlyCalendar;
