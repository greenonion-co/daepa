import { cn } from "@/lib/utils";
import { FieldName, FormStep } from "../../register/types";
import { Minus, Plus } from "lucide-react";

interface NumberFieldProps {
  inputClassName: string;
  field: FormStep["field"];
  value: string;
  setValue: (value: { type: FieldName; value: string }) => void;
  disabled?: boolean;
  placeholder?: string;
  stepAmount?: number;
}

const NumberField = ({
  inputClassName,
  field,
  value,
  setValue,
  disabled = false,
  placeholder,
  stepAmount = 1,
}: NumberFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
      setValue({ type: field.name, value: inputValue });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9.]/.test(e.key)) {
      e.preventDefault();
    }
    if (e.key === "." && (value as string).includes(".")) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="relative flex">
        <input
          type="tel"
          name={field.name}
          inputMode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          className={cn(
            inputClassName,
            "text-black dark:text-white",
            disabled && "cursor-not-allowed",
          )}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          min="0"
          placeholder={placeholder}
        />
        <p className="absolute bottom-1.5 right-2 text-[14px] text-gray-500">{field?.unit}</p>
      </div>

      {!disabled && (
        <div className="flex h-[32px] items-center gap-1 rounded-lg bg-gray-100 p-1 text-gray-500">
          <div
            className="cursor-pointer rounded-md p-1 hover:bg-gray-200"
            onClick={() => {
              if (Number(value) - stepAmount < 0) return;
              setValue({ type: field.name, value: String(Number(value) - stepAmount) });
            }}
          >
            <Minus className="h-4 w-4" />
          </div>
          <div className="h-4 w-[1px] bg-gray-200" />
          <div
            className="cursor-pointer rounded-md p-1 hover:bg-gray-200"
            onClick={() => {
              setValue({ type: field.name, value: String(Number(value) + stepAmount) });
            }}
          >
            <Plus className="h-4 w-4" />
          </div>
        </div>
      )}
    </div>
  );
};

export default NumberField;
