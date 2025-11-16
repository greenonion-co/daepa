import {
  FORM_STEPS,
  MORPH_LIST_BY_SPECIES,
  OPTION_STEPS,
  SELECTOR_CONFIGS,
} from "@/app/(브리더스룸)/constants";
import { FieldName, FormStep } from "@/app/(브리더스룸)/register/types";

import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import InfoItem from "@/app/(브리더스룸)/components/Form/InfoItem";
import { FormField } from "@/app/(브리더스룸)/components/Form/FormField";
import { memo, useCallback, useMemo } from "react";
import { overlay } from "overlay-kit";
import MultiSelectList from "@/app/(브리더스룸)/components/selector/MultiSelectList";
import { PetDtoSpecies } from "@repo/api-client";

const PET_REQUIRED_FIELDS = ["name", "sex", "growth", "morphs", "species"];
const EGG_REQUIRED_FIELDS = ["name", "species", "growth", "temperature", "eggStatus"];
const PET_DETAIL_FIELDS = ["traits", "foods", "hatchingDate", "weight", "desc", "photos"];
const EGG_DETAIL_FIELDS = ["temperature", "eggStatus"];

interface BreedingInfoSectionProps {
  isEgg: boolean;
  isEditing: boolean;
  isTooltipOpen: boolean;
}

const BreedingInfoSection = memo(
  ({ isEgg = false, isEditing, isTooltipOpen }: BreedingInfoSectionProps) => {
    const { formData, errors, setFormData } = usePetStore();

    const visibleFields = useMemo(() => {
      const requiredFields = isEgg ? EGG_REQUIRED_FIELDS : PET_REQUIRED_FIELDS;
      const detailFields = isEgg ? EGG_DETAIL_FIELDS : PET_DETAIL_FIELDS;
      return [
        ...FORM_STEPS.filter((step) => requiredFields.includes(step.field.name)),
        ...OPTION_STEPS.filter((step) => detailFields.includes(step.field.name)),
      ];
    }, [isEgg]);

    const handleChange = useCallback(
      (value: { type: FieldName; value: string | string[] | null }) => {
        if (!isEditing) return;
        setFormData((prev) => ({ ...prev, [value.type]: value.value }));
      },
      [isEditing, setFormData],
    );

    const getDisplayMap = useCallback(
      (type: FieldName): Record<string, string> => {
        switch (type) {
          case "morphs": {
            return MORPH_LIST_BY_SPECIES[formData.species as PetDtoSpecies];
          }

          default: {
            const config = SELECTOR_CONFIGS[type as keyof typeof SELECTOR_CONFIGS];
            if (!config) return {};
            return config.selectList.reduce(
              (acc, { key, value }) => {
                acc[key] = value;
                return acc;
              },
              {} as Record<string, string>,
            );
          }
        }
      },
      [formData.species],
    );

    const handleMultipleSelect = useCallback(
      (type: FieldName) => {
        const displayMap = getDisplayMap(type);
        const title = SELECTOR_CONFIGS[type as keyof typeof SELECTOR_CONFIGS]?.title || "선택";

        overlay.open(({ isOpen, close, unmount }) => (
          <MultiSelectList
            isOpen={isOpen}
            onCloseAction={close}
            onSelectAction={(value) => {
              handleChange({ type, value });
              close();
            }}
            displayMap={displayMap}
            title={title}
            initialValue={formData[type]}
            onExit={unmount}
          />
        ));
      },
      [getDisplayMap, formData, handleChange],
    );

    const renderFormField = useCallback(
      (step: FormStep) => (
        <FormField
          field={step.field}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          disabled={!isEditing}
          handleMultipleSelect={handleMultipleSelect}
        />
      ),
      [formData, errors, handleChange, isEditing, handleMultipleSelect],
    );

    const renderInfoItem = useCallback(
      (step: FormStep) => (
        <InfoItem
          key={step.field.name}
          label={step.title}
          className={step.field.type === "textarea" ? "" : "flex gap-4"}
          value={renderFormField(step)}
        />
      ),
      [renderFormField],
    );

    return (
      <div>
        <div className="mb-2 flex items-center gap-1">
          <h2 className="text-xl font-bold">사육 정보</h2>
          {isTooltipOpen && <BreedingInfoTooltip isTooltipOpen={isTooltipOpen} />}
        </div>

        <div className="space-y-4">
          <div>{visibleFields.map(renderInfoItem)}</div>
        </div>
      </div>
    );
  },
);

const BreedingInfoTooltip = memo(({ isTooltipOpen }: { isTooltipOpen: boolean }) => {
  return (
    <Tooltip open={isTooltipOpen}>
      <TooltipTrigger>
        <InfoIcon className="mr-1 h-4 w-4 text-red-500" />
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>
          <span className="font-bold">모프, 이름, 생년월일 </span>은 알에서 부화한 개체의 필수
          정보입니다.
          <br />
          수정 후 저장하여 해칭을 완료해주세요.
        </p>
      </TooltipContent>
    </Tooltip>
  );
});

BreedingInfoTooltip.displayName = "BreedingInfoTooltip";
BreedingInfoSection.displayName = "BreedingInfoSection";

export default BreedingInfoSection;
