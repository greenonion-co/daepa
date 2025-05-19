import { cn } from "@/lib/utils";
import { FieldName, FormStep } from "../../register/types";

interface NumberFieldProps {
  inputClassName: string;
  field: FormStep["field"];
  value: string;
  setValue: (value: { type: FieldName; value: string }) => void;
  disabled?: boolean;
}

const NumberField = ({
  inputClassName,
  field,
  value,
  setValue,
  disabled = false,
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
    <div className="relative">
      <input
        type="tel"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        className={cn(inputClassName, "text-black dark:text-white")}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        min="0"
      />
      <p className="absolute bottom-2 right-1 text-xl text-gray-400">g</p>
    </div>
  );
};

export default NumberField;
