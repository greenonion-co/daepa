import NameDuplicateCheckInput from "@/app/(브리더스룸)/components/NameDuplicateCheckInput";
import CalendarInput from "@/app/(브리더스룸)/hatching/components/CalendarInput";
import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import FormItem from "../FormItem";
import { DateTime } from "luxon";
import { PetDtoSpecies } from "@repo/api-client";
import { Info } from "lucide-react";

interface PetBasicInfoProps {
  formData: {
    name?: string;
    hatchingDate?: string;
    species?: PetDtoSpecies;
    morphs?: string[];
    traits?: string[];
  };
  errors: {
    name?: string;
  };
  isEditMode: boolean;
  isEgg: boolean;
  onNameChange: (name: string) => void;
  onHatchingDateChange: (date: string) => void;
  onFieldBlur?: (field: string) => void;
}

export const PetBasicInfo = ({
  formData,
  errors,
  isEditMode,
  isEgg,
  onNameChange,
  onHatchingDateChange,
  onFieldBlur,
}: PetBasicInfoProps) => {
  return (
    <>
      <FormItem
        label="개체 이름"
        content={
          <NameDuplicateCheckInput
            errorMessage={errors.name || ""}
            disabled={!isEditMode}
            value={String(formData.name || "")}
            placeholder="미정"
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => onFieldBlur?.("name")}
          />
        }
      />

      {!isEgg && (
        <FormItem
          label="해칭일"
          content={
            <CalendarInput
              variant="form"
              editable={isEditMode}
              placeholder="-"
              value={formData.hatchingDate}
              onSelect={(date) => {
                if (!date) return;
                onHatchingDateChange(DateTime.fromJSDate(date).toFormat("yyyy-MM-dd"));
              }}
            />
          }
        />
      )}

      <FormItem
        label="종"
        content={<SingleSelect disabled type="species" initialItem={formData.species} />}
        subContent={
          isEditMode ? (
            <div className="mt-1 flex items-center gap-1">
              <Info size={14} color="red" />
              <span className="text-xs text-red-600">종은 수정 불가능합니다.</span>
            </div>
          ) : null
        }
      />
    </>
  );
};
