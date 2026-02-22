import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import FormItem from "../FormItem";
import { cn } from "@/lib/utils";

interface EggInfoProps {
  formData: {
    eggStatus?: string;
    temperature?: number | string;
  };
  isEditMode: boolean;
  onFieldChange: (field: string, value: any) => void;
  onFieldInput?: (field: string, value: any) => void;
  onFieldBlur?: (field: string) => void;
}

export const EggInfo = ({
  formData,
  isEditMode,
  onFieldChange,
  onFieldInput,
  onFieldBlur,
}: EggInfoProps) => {
  const handleInput = onFieldInput ?? onFieldChange;

  return (
    <>
      <FormItem
        label="알 상태"
        content={
          <SingleSelect
            variant="form"
            disabled={!isEditMode}
            type="eggStatus"
            initialItem={formData.eggStatus}
            onSelect={(item) => onFieldChange("eggStatus", item)}
          />
        }
      />

      <FormItem
        label="해칭 온도"
        content={
          <NumberField
            disabled={!isEditMode}
            field={{ name: "temperature", type: "number", unit: "°C" }}
            value={String(formData.temperature ?? "")}
            setValue={(value) => handleInput("temperature", value.value)}
            onBlur={() => onFieldBlur?.("temperature")}
            inputClassName={cn(
              "h-[32px] w-full rounded-md border border-gray-200 p-2 placeholder:font-[500]",
              !isEditMode && "border-none",
            )}
          />
        }
      />
    </>
  );
};
