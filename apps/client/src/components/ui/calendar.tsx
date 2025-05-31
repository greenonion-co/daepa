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
  eggCounts,
  ...props
}: React.ComponentProps<typeof DayPicker> & { eggCounts: Record<string, number> }) {
  const koreanWeekdays = ["일", "월", "화", "수", "목", "금", "토"];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full p-3", className)}
      classNames={{
        months: "flex flex-col gap-2 ",
        month: "flex flex-col gap-4 ",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: " border-collapse space-x-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1",
        row: "flex mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected].day-range-end)]:rounded-r-md flex-1",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-12 w-8 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      formatters={{
        formatWeekdayName: (weekday) => koreanWeekdays[weekday.getDay()],
        formatCaption: (month) => {
          const year = month.getFullYear();
          const monthNumber = month.getMonth() + 1;
          return (
            <div className="flex flex-col items-center">
              <span className="text-sm">{monthNumber}월</span>
              <span className="text-muted-foreground text-xs">{year}년</span>
            </div>
          );
        },
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
        DayContent: ({ date, ...props }) => {
          const count = eggCounts[date.toISOString().split("T")[0]] || 0;

          return (
            <div className="flex flex-col items-center">
              <span className="text-sm">{date.getDate()}</span>

              {count > 0 && (
                <span className="mt-1 text-xs font-medium text-blue-500">{count}개</span>
              )}
            </div>
          );
        },
        Caption: ({ displayMonth }) => {
          const month = displayMonth.getMonth() + 1;
          const year = displayMonth.getFullYear();

          // 최소/최대 연도 체크
          const isMinYear = year === years[0];
          const isMaxYear = year === years[years.length - 1];

          // 최소/최대 월 체크
          const isMinMonth = isMinYear && month === 1;
          const isMaxMonth = isMaxYear && month === 12;

          return (
            <div className="flex w-full items-center justify-between">
              <button
                onClick={() => {
                  const newDate = new Date(year, month - 2);
                  props.onMonthChange?.(newDate);
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

              <div className="flex items-center justify-center gap-2">
                <Select
                  value={year.toString()}
                  onValueChange={(newYear) => {
                    const newDate = new Date(parseInt(newYear), month - 1);
                    props.onMonthChange?.(newDate);
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
                    props.onMonthChange?.(newDate);
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

              <button
                onClick={() => {
                  const newDate = new Date(year, month);
                  props.onMonthChange?.(newDate);
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
          );
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
