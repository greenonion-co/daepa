import {
  FORM_STEPS,
  MORPH_LIST_BY_SPECIES,
  OPTION_STEPS,
  SELECTOR_CONFIGS,
} from "@/app/(브리더스룸)/constants";
import { FieldName, FormStep } from "@/app/(브리더스룸)/register/types";
import { PetSummaryDto } from "@repo/api-client";

import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import InfoItem from "@/app/(브리더스룸)/components/Form/InfoItem";
import { FormField } from "@/app/(브리더스룸)/components/Form/FormField";
import { memo, useCallback, useMemo } from "react";
import { overlay } from "overlay-kit";
import MultipleSelector from "@/app/(브리더스룸)/components/selector/multiple";

interface BreedingInfoSectionProps {
  isEditing: boolean;
  isTooltipOpen: boolean;
}

const BreedingInfoSection = memo(({ isEditing, isTooltipOpen }: BreedingInfoSectionProps) => {
  const { formData, errors, setFormData } = usePetStore();

  const visibleFields = useMemo(
    () => [
      ...[...FORM_STEPS].reverse(),
      ...OPTION_STEPS.filter((step) =>
        ["traits", "foods", "hatchingDate", "weight", "name", "desc", "photos"].includes(
          step.field.name,
        ),
      ),
    ],
    [],
  );

  const handleChange = useCallback(
    (value: { type: FieldName; value: string | string[] | PetSummaryDto | null }) => {
      if (!isEditing) return;
      setFormData((prev) => ({ ...prev, [value.type]: value.value }));
    },
    [isEditing, setFormData],
  );

  const getSelectList = useCallback(
    (type: FieldName) => {
      switch (type) {
        case "morphs":
          return (
            MORPH_LIST_BY_SPECIES[formData.species as keyof typeof MORPH_LIST_BY_SPECIES] ?? []
          );
        default:
          return SELECTOR_CONFIGS[type as keyof typeof SELECTOR_CONFIGS].selectList ?? [];
      }
    },
    [formData.species],
  );

  const handleMultipleSelect = useCallback(
    (type: FieldName) => {
      overlay.open(({ isOpen, close, unmount }) => (
        <MultipleSelector
          isOpen={isOpen}
          onCloseAction={close}
          onSelectAction={(value) => {
            handleChange({ type, value });
            close();
          }}
          selectList={getSelectList(type) || []}
          initialValue={formData[type]}
          onExit={unmount}
        />
      ));
    },
    [getSelectList, formData, handleChange],
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
});

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
