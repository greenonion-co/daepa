import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import FormMultiSelect from "@/app/(브리더스룸)/components/FormMultiSelect";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import FormItem from "../FormItem";
import {
  MORPH_LIST_BY_SPECIES,
  SELECTOR_CONFIGS,
  TRAIT_LIST_BY_SPECIES,
} from "@/app/(브리더스룸)/constants";
import { PetDtoSpecies } from "@repo/api-client";
import { cn } from "@/lib/utils";

interface PetDetailInfoProps {
  formData: {
    species?: PetDtoSpecies;
    sex?: string;
    growth?: string;
    weight?: number | string;
    morphs?: string[];
    traits?: string[];
    foods?: string[];
    desc?: string;
  };
  isEditMode: boolean;
  onFieldChange: (field: string, value: any) => void;
  onFieldInput?: (field: string, value: any) => void;
  onFieldBlur?: (field: string) => void;
}

export const PetDetailInfo = ({
  formData,
  isEditMode,
  onFieldChange,
  onFieldInput,
  onFieldBlur,
}: PetDetailInfoProps) => {
  const handleInput = onFieldInput ?? onFieldChange;

  return (
    <>
      <FormItem
        label="성별"
        content={
          <SingleSelect
            saveASAP
            variant="form"
            disabled={!isEditMode}
            type="sex"
            initialItem={formData.sex}
            onSelect={(item) => onFieldChange("sex", item)}
          />
        }
      />

      <FormItem
        label="크기"
        content={
          <SingleSelect
            saveASAP
            variant="form"
            disabled={!isEditMode}
            type="growth"
            initialItem={formData.growth}
            onSelect={(item) => onFieldChange("growth", item)}
          />
        }
      />

      <FormItem
        label="몸무게"
        content={
          <NumberField
            disabled={!isEditMode}
            field={{ name: "weight", type: "number", unit: "g" }}
            value={String(formData.weight ?? "")}
            setValue={(value) => handleInput("weight", value.value)}
            onBlur={() => onFieldBlur?.("weight")}
            placeholder={isEditMode ? "" : "-"}
            inputClassName={cn(
              "h-[32px] w-full rounded-md border font-[500] border-gray-200 p-2 placeholder:font-[500]",
              !isEditMode && "border-none",
            )}
          />
        }
      />

      <FormItem
        label="모프"
        content={
          <FormMultiSelect
            disabled={!isEditMode}
            title="모프"
            displayMap={formData.species ? MORPH_LIST_BY_SPECIES[formData.species] : {}}
            initialItems={formData.morphs}
            onSelect={(items) => onFieldChange("morphs", items)}
          />
        }
      />

      <FormItem
        label="형질"
        content={
          <FormMultiSelect
            disabled={!isEditMode}
            title="형질"
            displayMap={formData.species ? TRAIT_LIST_BY_SPECIES[formData.species] : {}}
            initialItems={formData.traits}
            onSelect={(items) => onFieldChange("traits", items)}
          />
        }
      />

      <FormItem
        label="먹이"
        content={
          <FormMultiSelect
            disabled={!isEditMode}
            title="먹이"
            displayMap={Object.fromEntries(
              SELECTOR_CONFIGS.foods.selectList.map(({ key, value }) => [key, value]),
            )}
            initialItems={formData.foods}
            onSelect={(items) => onFieldChange("foods", items)}
          />
        }
      />

      <FormItem
        label="설명"
        content={
          <div className="w-full">
            <textarea
              disabled={!isEditMode}
              value={formData.desc ?? ""}
              onChange={(e) => handleInput("desc", e.target.value)}
              onBlur={() => onFieldBlur?.("desc")}
              maxLength={100}
              placeholder={isEditMode ? "펫 설명을 입력하세요" : "-"}
              className={cn(
                "min-h-[80px] w-full resize-none rounded-md border border-gray-200 p-2 text-sm font-[500] placeholder:font-[500] disabled:bg-transparent dark:border-gray-700 dark:bg-transparent",
                !isEditMode && "border-none",
              )}
            />
            {isEditMode && (
              <div className="mt-1 text-right text-xs text-gray-400">
                {formData.desc?.length ?? 0}/100
              </div>
            )}
          </div>
        }
      />
    </>
  );
};
