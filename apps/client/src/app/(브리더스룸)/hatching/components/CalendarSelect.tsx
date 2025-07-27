import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface CalendarSelectProps {
  disabledDates: Date[];
  triggerText?: string;
  confirmButtonText?: string;
  disabled?: (date: Date) => boolean;
  onConfirm: (matingDate: string) => void;
}

const CalendarSelect = ({
  disabledDates,
  onConfirm,
  triggerText,
  confirmButtonText,
  disabled,
}: CalendarSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [matingDate, setMatingDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMatingDate(undefined);
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          data-field-name="matingDate"
          className={cn(
            "flex w-full cursor-pointer items-center justify-center gap-2 font-semibold",
          )}
        >
          {triggerText} <CalendarIcon className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={matingDate ? new Date(matingDate) : undefined}
          onSelect={(date) => {
            if (date) {
              const dateString = format(date, "yyyyMMdd");
              const matingDateStrings = disabledDates.map((d) => format(d, "yyyyMMdd"));

              if (matingDateStrings.includes(dateString)) {
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
            hasMating: disabledDates,
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
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-b-lg bg-black p-2 text-sm font-semibold text-white transition-colors hover:bg-black/80"
        >
          {matingDate ? format(new Date(matingDate), "yyyy년 MM월 dd일") : ""} {confirmButtonText}
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarSelect;
