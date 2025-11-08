"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useEffect } from "react";
import { format } from "date-fns";
type EggCounts = Record<string, { hatched: number; egg: number; total: number }>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  eggCounts,
  onMonthChange,
  ...props
}: React.ComponentProps<typeof DayPicker> & { eggCounts?: EggCounts }) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  const koreanWeekdays = ["일", "월", "화", "수", "목", "금", "토"];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i);

  useEffect(() => {
    onMonthChange?.(currentMonth);
  }, [currentMonth, onMonthChange]);

  return (
    <DayPicker
      disabled={(date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        const count = eggCounts?.[dateKey];
        return !count || (count.egg === 0 && count.hatched === 0);
      }}
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      formatters={{
        formatWeekdayName: (date) => koreanWeekdays[date.getDay()],
      }}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col sm:flex-row w-fit",
        month: "flex flex-col gap-2",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.75rem]",
        row: "flex [&:has([aria-selected])]:bg-gray-100 [&:has([aria-selected])]:rounded-xl",
        cell: cn(
          "relative text-center focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:rounded-xl",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "p-0 size-9 font-normal aria-selected:opacity-100 hover:bg-gray-50",
        ),
        day_selected: "text-blue-600 focus:text-blue-700",
        day_today: "text-accent-foreground text-blue-500",
        day_outside: "day-outside text-gray-200 aria-selected:text-blue-500",
        day_disabled: "opacity-40 cursor-not-allowed",
        ...classNames,
      }}
      components={{
        DayContent: ({
          date,
          activeModifiers,
        }: {
          date: Date;
          activeModifiers?: { outside?: boolean; disabled?: boolean };
        }) => {
          const isDisabled = !!activeModifiers?.disabled;
          const isOutside = !!activeModifiers?.outside;
          const colorClass = isDisabled
            ? isOutside
              ? "text-gray-300"
              : "text-gray-500"
            : undefined;

          return (
            <div
              className={cn(
                "flex flex-col items-center gap-1 text-sm font-medium",
                isDisabled ? "cursor-not-allowed" : "cursor-pointer",
                colorClass,
              )}
            >
              {date.getDate()}
            </div>
          );
        },
        Caption: ({ displayMonth }: { displayMonth: Date }) => {
          const month = displayMonth.getMonth() + 1;
          const year = displayMonth.getFullYear();

          // 최소/최대 연도 체크
          const isMinYear = year === years[0];
          const isMaxYear = year === years[years.length - 1];

          // 최소/최대 월 체크
          const isMinMonth = isMinYear && month === 1;
          const isMaxMonth = isMaxYear && month === 12;

          return (
            <div className="flex items-center justify-between pl-2">
              <div className="text-sm font-medium">
                {year}년 {month}월
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const newDate = new Date(year, month - 2);
                    setCurrentMonth(newDate);
                  }}
                  disabled={isMinMonth}
                  className={cn(
                    "size-7 border-none p-0",
                    isMinMonth ? "cursor-not-allowed opacity-30" : "opacity-50 hover:opacity-100",
                  )}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => {
                    const newDate = new Date(year, month);
                    setCurrentMonth(newDate);
                  }}
                  disabled={isMaxMonth}
                  className={cn(
                    "size-7 border-none",
                    isMaxMonth ? "cursor-not-allowed opacity-30" : "opacity-50 hover:opacity-100",
                  )}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          );
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
