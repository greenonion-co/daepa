import { cn } from "@/lib/utils";
import { useFormStore } from "../../store/form";
import { FormStep } from "../../types";

const NumberField = ({
  inputClassName,
  field,
  value,
}: {
  inputClassName: string;
  field: FormStep["field"];
  value: string;
}) => {
  const { formData, setFormData } = useFormStore();
  return (
    <div className="relative">
      <input
        type="tel"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        className={cn(inputClassName, "text-black dark:text-white")}
        value={value}
        onChange={(e) => {
          const inputValue = e.target.value;
          if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
            setFormData({ ...formData, [field.name]: inputValue });
          }
        }}
        onKeyPress={(e) => {
          if (!/[0-9.]/.test(e.key)) {
            e.preventDefault();
          }
          if (e.key === "." && (value as string).includes(".")) {
            e.preventDefault();
          }
        }}
        min="0"
      />
      <p className="absolute bottom-2 right-1 text-xl text-gray-400">g</p>
    </div>
  );
};

export default NumberField;
