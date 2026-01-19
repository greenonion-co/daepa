import { useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DUPLICATE_CHECK_STATUS, TRAIT_LIST_BY_SPECIES } from "../../constants";
import { FormFieldName, FormStep } from "../../pet/types/form.type";
import {
  MORPH_LIST_BY_SPECIES,
  REGISTER_PAGE,
  SELECTOR_CONFIGS,
  TABLE_HEADER,
} from "../../constants";
import { overlay } from "overlay-kit";
import MultiSelectList from "../../components/selector/MultiSelectList";
import Dialog from "../../components/Form/Dialog";

import { validateStep } from "@/lib/form";
import { toast } from "@/lib/toast";
import { useNameStore } from "../../store/name";
import { PetDtoSpecies } from "@repo/api-client";
import { BaseFormData } from "../../pet/store/base";

type SELECTOR_TYPE = "species" | "growth" | "sex";

interface UseRegisterFormProps {
  formStep: FormStep[];
  formData: BaseFormData;
  step: number;
  setErrors: (errors: Record<string, string>) => void;
  setStep: (step: number) => void;
  setFormData: (data: BaseFormData | ((prev: BaseFormData) => BaseFormData)) => void;
  handleSubmit: (data: BaseFormData) => void;
  nameFieldRef?: React.RefObject<HTMLDivElement | null>;
  setShouldShake?: (value: boolean) => void;
}

export const useRegisterForm = ({
  formStep,
  formData,
  step,
  setErrors,
  setStep,
  setFormData,
  handleSubmit,
  nameFieldRef,
  setShouldShake,
}: UseRegisterFormProps) => {
  const router = useRouter();
  const { funnel } = useParams();
  const searchParams = useSearchParams();
  const { duplicateCheckStatus } = useNameStore();

  // 다음 단계로 이동
  const goNext = useCallback(
    async (newFormData = formData): Promise<void> => {
      const { errors, isValid } = validateStep({
        formStep,
        data: newFormData,
        currentStep: step,
      });

      setErrors(errors);

      if (!isValid) {
        toast.error(
          Object.entries(errors)
            .map(
              ([key, error]) => `${TABLE_HEADER[key as keyof typeof TABLE_HEADER]}은(는) ${error}`,
            )
            .join("\n"),
        );
        return;
      }

      if (Number(funnel) === REGISTER_PAGE.SECOND) {
        // 펫 생성 전 닉네임 중복 검증
        if (duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE) {
          toast.error("닉네임 중복확인을 완료해주세요.");

          // 닉네임 영역으로 스크롤
          if (nameFieldRef?.current) {
            nameFieldRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
          // 이름 박스 흔들림 트리거
          if (setShouldShake) {
            setShouldShake(true);
            window.setTimeout(() => setShouldShake(false), 1200);
          }
          return;
        }
        handleSubmit(newFormData);
        return;
      }

      if (step === formStep.length) {
        const params = searchParams.toString();
        router.push(`/register/2${params ? `?${params}` : ""}`);
        return;
      }

      if (step + 1 === Object.keys(newFormData).length) {
        setStep(step + 1);
      }
    },
    [
      step,
      setStep,
      formData,
      router,
      handleSubmit,
      funnel,
      setErrors,
      formStep,
      duplicateCheckStatus,
      setShouldShake,
      nameFieldRef,
      searchParams,
    ],
  );

  // 입력 필드 변경
  const handleNext = useCallback(
    <K extends FormFieldName>({ type, value }: { type: K; value: BaseFormData[K] }) => {
      if (
        type === "species" &&
        formData.species !== value &&
        Array.isArray(formData.morphs) &&
        formData.morphs.length > 0
      ) {
        overlay.open(({ isOpen, close, unmount }) => (
          <Dialog
            isOpen={isOpen}
            onCloseAction={close}
            onConfirmAction={() => {
              setFormData((prev) => ({ ...prev, species: value as string, morphs: [] }));
              close();
            }}
            title="종 변경 안내"
            description={`종을 변경하면 선택된 모프가 초기화됩니다. \n 계속하시겠습니까?`}
            onExit={unmount}
          />
        ));
        return;
      }

      const newFormData = { ...formData, [type]: value };
      setFormData(newFormData);

      if (Number(funnel) === REGISTER_PAGE.FIRST && step <= formStep.length - 1) {
        goNext(newFormData);
      }
    },
    [formData, setFormData, goNext, formStep, funnel, step],
  );

  // displayMap 조회
  const getDisplayMap = useCallback(
    (type: FormFieldName): Record<string, string> => {
      switch (type) {
        case "morphs": {
          return MORPH_LIST_BY_SPECIES[formData.species as PetDtoSpecies];
        }
        case "traits": {
          return TRAIT_LIST_BY_SPECIES[formData.species as PetDtoSpecies];
        }
        default: {
          const config = SELECTOR_CONFIGS[type as SELECTOR_TYPE];
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

  // 다중 선택 리스트 오픈
  const handleMultipleSelect = useCallback(
    (type: FormFieldName) => {
      const displayMap = getDisplayMap(type);

      overlay.open(({ isOpen, close, unmount }) => (
        <MultiSelectList
          isOpen={isOpen}
          onCloseAction={close}
          onSelectAction={(value) => {
            handleNext({ type, value });
            close();
          }}
          displayMap={displayMap}
          initialValue={formData[type]}
          onExit={unmount}
          maxSelection={type === "traits" ? 10 : 5}
        />
      ));
    },
    [getDisplayMap, handleNext, formData],
  );

  return useMemo(
    () => ({
      handleNext,
      goNext,
      handleMultipleSelect,
    }),
    [handleNext, goNext, handleMultipleSelect],
  );
};
