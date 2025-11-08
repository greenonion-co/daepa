import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { Pencil } from "lucide-react";

interface CalendarSelectProps {
  type?: "create" | "edit";
  disabledDates?: string[];
  triggerText?: string;
  confirmButtonText?: string;
  initialDate?: string;
  disabled?: (date: Date) => boolean;
  onConfirm: (matingDate: string) => void;
}

const CalendarSelect = ({
  type = "create",
  disabledDates = [],
  onConfirm,
  triggerText,
  confirmButtonText,
  initialDate,
  disabled,
}: CalendarSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [matingDate, setMatingDate] = useState<string | undefined>(initialDate);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          data-field-name="matingDate"
          className={cn(
            "flex w-fit items-center justify-center gap-1 rounded-lg px-1 text-[14px] font-[500] text-blue-600 hover:bg-blue-50",
          )}
        >
          {type === "create" && (
            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 text-[12px] text-blue-600">
              +
            </div>
          )}
          <div className="flex cursor-pointer items-center gap-1 text-blue-600">{triggerText}</div>
          {type === "edit" && <Pencil className="h-3 w-3 text-blue-600" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0" align="start">
        <Calendar
          mode="single"
          selected={matingDate ? parseISO(matingDate) : undefined}
          onSelect={(date) => {
            if (date) {
              const dateString = format(date, "yyyy-MM-dd");

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
            hasMating: disabledDates.map((d) => parseISO(d)),
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

        <button
          onClick={() => {
            if (!matingDate) {
              toast.error("날짜를 선택해주세요.");
              return;
            }
            onConfirm(matingDate);
            setIsOpen(false);
          }}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-b-2xl bg-gray-800 p-2 text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          {matingDate ? format(parseISO(matingDate), "yyyy년 MM월 dd일") : ""} {confirmButtonText}
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarSelect;
