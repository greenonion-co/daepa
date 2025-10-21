"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useEffect } from "react";
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
      showOutsideDays={showOutsideDays}
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      formatters={{
        formatWeekdayName: (date) => koreanWeekdays[date.getDay()],
      }}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row",
        month: "flex flex-col gap-2",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] py-2",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          eggCounts ? "w-11 h-20" : "size-11",
          "p-0 size-9 font-normal aria-selected:opacity-100 hover:bg-gray-50",
        ),
        day_range_start: "day-range-start aria-selected:bg-zinc-500 aria-selected:text-zinc-100",
        day_range_end: "day-range-end aria-selected:bg-zinc-500 aria-selected:text-zinc-100",
        day_selected: "bg-zinc-800 text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100",
        day_today: "bg-accent text-accent-foreground border-[1.8px] border-zinc-200",
        day_outside: "day-outside text-gray-200 aria-selected:text-blue-500",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        DayContent: ({ date }: { date: Date }) => {
          const dateKey = format(date, "yyyy-MM-dd");
          const count = eggCounts?.[dateKey] ?? { hatched: 0, egg: 0, total: 0 };

          return (
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-medium">{date.getDate()}</span>
              <div className="flex flex-col items-center gap-0.5">
                {count.egg > 0 && (
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    🥚 {count.egg}
                  </span>
                )}
                {count.hatched > 0 && (
                  <span className="rounded-full bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
                    🐣 {count.hatched}
                  </span>
                )}
              </div>
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
