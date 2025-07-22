import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { DayModifiers, ModifiersStyles } from "react-day-picker";

interface CalendarInputProps {
  placeholder: string;
  value: string;
  modifiers?: DayModifiers;
  modifiersStyles?: ModifiersStyles;
  onSelect: (date?: Date) => void;
  disabled?: (date: Date) => boolean;
}

const CalendarInput = ({
  placeholder,
  value,
  onSelect,
  disabled,
  modifiers,
  modifiersStyles,
}: CalendarInputProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-field-name="layingDate"
          className={cn("flex w-full items-center justify-between", value && "text-black")}
        >
          {value ? format(new Date(value), "yyyy년 MM월 dd일") : placeholder}
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => onSelect(date)}
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
