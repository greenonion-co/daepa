import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
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
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full cursor-pointer items-center gap-1",
            value && "text-black dark:text-gray-200",
          )}
        >
          {value && isValid(new Date(value)) ? format(new Date(value), formatString) : placeholder}
          <CalendarIcon className="h-4 w-4 opacity-50" />
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
