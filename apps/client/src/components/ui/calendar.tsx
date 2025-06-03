"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  eggCounts = {} as Record<string, number>,
  onMonthChange,
  ...props
}: React.ComponentProps<typeof DayPicker> & { eggCounts: Record<string, number> }) {
  const koreanWeekdays = ["일", "월", "화", "수", "목", "금", "토"];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      formatters={{
        formatWeekdayName: (date) => koreanWeekdays[date.getDay()],
      }}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row",
        month: "flex flex-col gap-4",
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
        head_cell: "text-muted-foreground rounded-md w-11 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-11 p-0 font-normal aria-selected:opacity-100 ",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          " bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        DayContent: ({ date }: { date: Date }) => {
          const dateKey = date.toISOString().split("T")[0] as string;
          const count = eggCounts[dateKey] || 0;

          return (
            <div className="flex flex-col items-center">
              <span className="text-sm">{date.getDate()}</span>

              {count > 0 && <span className="mt-1 text-xs font-medium">🥚 {count}</span>}
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
            <>
              <div className="flex items-center justify-center gap-2">
                <Select
                  value={year.toString()}
                  onValueChange={(newYear) => {
                    const newDate = new Date(parseInt(newYear), month - 1);
                    onMonthChange?.(newDate);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue>{year}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={month.toString()}
                  onValueChange={(newMonth) => {
                    const newDate = new Date(year, parseInt(newMonth) - 1);
                    onMonthChange?.(newDate);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue>{month}월</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {m}월
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex w-full items-center justify-between">
                <button
                  onClick={() => {
                    const newDate = new Date(year, month - 2);
                    onMonthChange?.(newDate);
                  }}
                  disabled={isMinMonth}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "size-7 bg-transparent p-0",
                    isMinMonth ? "cursor-not-allowed opacity-30" : "opacity-50 hover:opacity-100",
                  )}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="flex flex-col items-center">
                  <div className="font-medium">{month}월</div>
                  <div className="text-muted-foreground text-sm">{year}</div>
                </div>
                <button
                  onClick={() => {
                    const newDate = new Date(year, month);
                    onMonthChange?.(newDate);
                  }}
                  disabled={isMaxMonth}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "size-7 bg-transparent p-0",
                    isMaxMonth ? "cursor-not-allowed opacity-30" : "opacity-50 hover:opacity-100",
                  )}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </>
          );
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
