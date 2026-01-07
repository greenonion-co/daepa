import { cn } from "@/lib/utils";
import { FormFieldName, FormStep } from "../../pet/types/form.type";
import { Minus, Plus } from "lucide-react";

interface NumberFieldProps {
  inputClassName: string;
  field: FormStep["field"];
  value: string;
  setValue: (value: { type: FormFieldName; value: string }) => void;
  disabled?: boolean;
  placeholder?: string;
  stepAmount?: number;
  readOnly?: boolean; // 키보드 입력 비활성화, 버튼으로만 조절 가능
  min?: number;
  max?: number;
}

const NumberField = ({
  inputClassName,
  field,
  value,
  setValue,
  disabled = false,
  placeholder,
  stepAmount = 1,
  readOnly = false,
  min,
  max,
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
            readOnly && "cursor-default",
          )}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          onChange={readOnly ? undefined : handleChange}
          onKeyPress={readOnly ? undefined : handleKeyPress}
          min={min ?? 0}
          max={max}
          placeholder={placeholder}
        />
        <p className="absolute bottom-1.5 right-2 text-[14px] text-gray-500">{field?.unit}</p>
      </div>

      {!disabled && (
        <div className="flex h-[32px] items-center gap-1 rounded-lg bg-gray-100 p-1 text-gray-500">
          <div
            className={cn(
              "rounded-md p-1",
              min !== undefined && Number(value) <= min
                ? "cursor-not-allowed opacity-40"
                : "cursor-pointer hover:bg-gray-200",
            )}
            onClick={() => {
              const newValue = Number(value) - stepAmount;
              if (min !== undefined && newValue < min) return;
              if (newValue < 0) return;
              setValue({ type: field.name, value: String(newValue) });
            }}
          >
            <Minus className="h-4 w-4" />
          </div>
          <div className="h-4 w-[1px] bg-gray-200" />
          <div
            className={cn(
              "rounded-md p-1",
              max !== undefined && Number(value) >= max
                ? "cursor-not-allowed opacity-40"
                : "cursor-pointer hover:bg-gray-200",
            )}
            onClick={() => {
              const newValue = Number(value) + stepAmount;
              if (max !== undefined && newValue > max) return;
              setValue({ type: field.name, value: String(newValue) });
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
