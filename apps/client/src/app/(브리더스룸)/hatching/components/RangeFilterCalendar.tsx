"use client";

import { Calendar } from "@/components/ui/calendar";
import { memo, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import Loading from "@/components/common/Loading";

import { DateRange } from "react-day-picker";
import {
  brPetControllerGetPetsByDateRange,
  brPetControllerGetPetsByMonth,
  PetDtoType,
} from "@repo/api-client";
import HatchingPetCard from "./HatchingPetCard";
import { Search } from "lucide-react";
import GuideText from "../../components/GuideText";

const RangeFilterCalendar = memo(() => {
  const [month, setMonth] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [tab, setTab] = useState<"all" | "hatched" | "notHatched">("all");

  // 월별 해칭된 펫 조회
  const { data: monthlyData, isPending: monthlyIsPending } = useQuery({
    queryKey: [brPetControllerGetPetsByMonth.name, month.getFullYear(), month.getMonth()],
    queryFn: () =>
      brPetControllerGetPetsByMonth({
        year: month.getFullYear().toString(),
        month: month.getMonth().toString(),
      }),
    select: (data) => data.data.data,
  });

  // 날짜 범위별 해칭된 펫 조회
  const { data: selectedData, isFetching: todayIsFetching } = useQuery({
    queryKey: [brPetControllerGetPetsByDateRange.name, dateRange?.from, dateRange?.to],
    queryFn: () => {
      const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
      const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;
      return brPetControllerGetPetsByDateRange({
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      });
    },
    select: (data) => data.data.data,
    enabled: !!dateRange?.from || !!dateRange?.to,
  });

  // 월별 해칭된 펫 개수 계산
  const petCounts = useMemo(() => {
    if (!monthlyData) return {};

    return Object.entries(monthlyData).reduce(
      (acc, [date, pets]) => {
        const hatched = pets.filter((pet) => pet.type === PetDtoType.PET).length;
        const notHatched = pets.filter((pet) => pet.type === PetDtoType.EGG).length;

        acc[date] = {
          hatched,
          notHatched, // 해칭된 펫만 조회하므로 0
          total: pets.length,
        };
        return acc;
      },
      {} as Record<string, { hatched: number; notHatched: number; total: number }>,
    );
  }, [monthlyData]);

  const visibleData = selectedData ?? monthlyData ?? {};

  return (
    <div>
      <GuideText icon={Search} text="시작일과 종료일을 선택해서 해칭 펫을 조회해보세요!" />

      <div className="flex gap-4">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          className="rounded-xl border shadow dark:border-gray-700"
          eggCounts={petCounts}
          onMonthChange={setMonth}
        />

        <ScrollArea className="relative flex h-[613px] w-full gap-2 rounded-xl border p-2 shadow">
          <div className="mb-3 rounded-xl bg-blue-100 px-3 py-2 text-center">
            <div className="text-sm font-medium text-blue-700">
              {dateRange?.from && dateRange?.to
                ? dateRange.from.getTime() === dateRange.to.getTime()
                  ? format(dateRange.from, "yyyy.MM.dd")
                  : `${format(dateRange.from, "yyyy.MM.dd")} - ${format(dateRange.to, "yyyy.MM.dd")}`
                : dateRange?.from
                  ? format(dateRange.from, "yyyy.MM.dd") + " ~ "
                  : `${month.getMonth() + 1}월`}
            </div>
          </div>
          <Tabs
            defaultValue="all"
            onValueChange={(value) => setTab(value as "all" | "hatched" | "notHatched")}
            className="sticky top-0 z-10 pb-2"
          >
            <TabsList>
              <TabsTrigger value="all">
                전체 ({Object.values(visibleData).flat().length || 0})
              </TabsTrigger>
              <TabsTrigger value="hatched">
                해칭된 펫 (
                {Object.values(visibleData || {})
                  .flat()
                  .filter((pet) => pet.type === PetDtoType.PET).length || 0}
                )
              </TabsTrigger>
              <TabsTrigger value="notHatched">
                해칭되지 않은 펫 (
                {Object.values(visibleData || {})
                  .flat()
                  .filter((pet) => pet.type === PetDtoType.EGG).length || 0}
                )
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {monthlyIsPending || todayIsFetching ? (
            <Loading />
          ) : (
            Object.entries(visibleData || {})
              .filter(([, pets]) => {
                if (tab === "all") return pets.length > 0;
                if (tab === "hatched")
                  return pets.filter((pet) => pet.type === PetDtoType.PET).length > 0;
                if (tab === "notHatched")
                  return pets.filter((pet) => pet.type === PetDtoType.EGG).length > 0;
              })
              .map(([date, pets]) => (
                <HatchingPetCard key={date} date={date} pets={pets} tab={tab} />
              ))
          )}
        </ScrollArea>
      </div>
    </div>
  );
});

RangeFilterCalendar.displayName = "RangeFilterCalendar";

export default RangeFilterCalendar;
