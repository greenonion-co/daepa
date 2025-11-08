import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown } from "lucide-react";
import { DayModifiers, ModifiersStyles } from "react-day-picker";
import { useState } from "react";

interface CalendarInputProps {
  placeholder: string;
  value?: string;
  formatString?: string;
  modifiers?: DayModifiers;
  modifiersStyles?: ModifiersStyles;
  onSelect: (date?: Date) => void;
  disabled?: (date: Date) => boolean;
  closeOnSelect?: boolean;
}

const CalendarInput = ({
  placeholder,
  value,
  formatString = "yyyy년 MM월 dd일",
  onSelect,
  disabled,
  modifiers,
  modifiersStyles,
  closeOnSelect = true,
}: CalendarInputProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        asChild
        className={cn(
          "flex h-[32px] w-fit cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
          value ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-800",
        )}
      >
        <button type="button">
          {placeholder}
          {value && isValid(new Date(value)) && `・${format(new Date(value), formatString)}`}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              value ? "text-blue-600" : "text-gray-600",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => {
            onSelect(date);
            if (closeOnSelect) {
              setIsOpen(false);
            }
          }}
          disabled={disabled}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default CalendarInput;
