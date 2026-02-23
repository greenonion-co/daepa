import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateTime } from "luxon";
import { toast } from "@/lib/toast";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";

interface CalendarSelectProps {
  type?: "create" | "edit";
  disabledDates?: string[];
  triggerText?: string;
  confirmButtonText?: string;
  initialDate?: string;
  triggerTextClassName?: string;
  disabled?: (date: Date) => boolean;
  showSeasonInput?: boolean;
  latestSeason?: number;
  onConfirm: (matingDate: string, season?: number) => void | Promise<void>;
}

const CalendarSelect = ({
  type = "create",
  disabledDates = [],
  onConfirm,
  triggerText,
  confirmButtonText,
  initialDate,
  disabled,
  triggerTextClassName,
  showSeasonInput,
  latestSeason,
}: CalendarSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [matingDate, setMatingDate] = useState<string | undefined>(initialDate);
  const [season, setSeason] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <div
          role="button"
          tabIndex={0}
          data-field-name="matingDate"
          className={cn(
            "flex w-fit cursor-pointer items-center justify-center gap-1 rounded-lg px-1 text-[14px] font-semibold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30",
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
        >
          {type === "create" && (
            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 text-[12px] text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <Plus className="h-2 w-2" />
            </div>
          )}
          <div className={cn("flex items-center gap-1", triggerTextClassName)}>{triggerText}</div>
          {type === "edit" && <Pencil className="h-3 w-3 text-blue-600 dark:text-blue-400" />}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0" align="start">
        <Calendar
          mode="single"
          selected={matingDate ? DateTime.fromISO(matingDate).toJSDate() : undefined}
          onSelect={(date) => {
            if (date) {
              const dateString = DateTime.fromJSDate(date).toFormat("yyyy-MM-dd");

              if (disabledDates.includes(dateString)) {
                toast.error(`이미 등록된 날짜입니다.`);
                return;
              }

              // 날짜만 처리하도록 수정 (시간대 문제 해결)
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              setMatingDate(`${year}-${month}-${day}`);
            }
          }}
          disabled={disabled}
          modifiers={{
            hasMating: disabledDates.map((d) => DateTime.fromISO(d).toJSDate()),
          }}
          modifiersStyles={{
            hasMating: {
              backgroundColor: "#fef3c7",
              color: "#92400e",
              fontWeight: "bold",
            },
          }}
          initialFocus
        />

        {showSeasonInput && (
          <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2">
            <label htmlFor="calendar-season" className="text-xs font-semibold text-gray-600">
              시즌
            </label>
            <input
              id="calendar-season"
              type="number"
              min={1}
              className="h-7 w-16 rounded-md border border-gray-200 px-2 text-sm"
              placeholder="몇 차"
              value={season ?? ""}
              onChange={(e) => setSeason(e.target.value ? Number(e.target.value) : undefined)}
            />
            {latestSeason != null && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                *이 페어의 직전 시즌은 [{latestSeason}]입니다.
              </span>
            )}
          </div>
        )}

        <button
          disabled={isSubmitting}
          onClick={async () => {
            if (!matingDate) {
              toast.error("날짜를 선택해주세요.");
              return;
            }
            setIsSubmitting(true);
            try {
              await onConfirm(matingDate, season);
              setIsOpen(false);
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-b-2xl bg-gray-800 p-2 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {matingDate ? DateTime.fromISO(matingDate).toFormat("yyyy년 MM월 dd일") : ""}{" "}
          {confirmButtonText}
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarSelect;
