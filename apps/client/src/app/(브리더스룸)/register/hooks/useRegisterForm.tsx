import { useCallback, useMemo } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FieldName, FormStep } from "../types";
import { MORPH_LIST_BY_SPECIES, REGISTER_PAGE, SELECTOR_CONFIGS } from "../../constants";
import { overlay } from "overlay-kit";
import MultipleSelector from "../../components/selector/multiple";
import { PetSummaryDto } from "@repo/api-client";
import Dialog from "../../components/Form/Dialog";

import { validateStep } from "@/lib/form";
import { FormData } from "../store/pet";
import { toast } from "sonner";

type SELECTOR_TYPE = "species" | "growth" | "sex";

interface UseRegisterFormProps {
  formStep: FormStep[];
  formData: FormData;
  step: number;
  setErrors: (errors: Record<string, string>) => void;
  setStep: (step: number) => void;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  handleSubmit: (data: FormData) => void;
}

export const useRegisterForm = ({
  formStep,
  formData,
  step,
  setErrors,
  setStep,
  setFormData,
  handleSubmit,
}: UseRegisterFormProps) => {
  const router = useRouter();
  const { funnel } = useParams();
  const isEggRegister = usePathname().includes("egg");

  // 다음 단계로 이동
  const goNext = useCallback(
    async (newFormData = formData) => {
      const { errors, isValid } = validateStep({
        formStep,
        data: newFormData,
        currentStep: step,
      });

      setErrors(errors);

      if (!isValid) {
        toast.error("에러를 확인해주세요.");
        return;
      }

      if (isEggRegister) {
        if (step + 1 >= formStep.length) {
          handleSubmit(newFormData);
          return;
        }

        setStep(step + 1);
      } else {
        if (Number(funnel) === REGISTER_PAGE.SECOND) {
          handleSubmit(newFormData);
          return;
        }

        if (step === formStep.length) {
          router.push("/register/2");
          return;
        }

        if (step + 1 === Object.keys(newFormData).length) {
          setStep(step + 1);
        }
      }
    },
    [step, setStep, formData, router, handleSubmit, funnel, setErrors, formStep, isEggRegister],
  );

  // 입력 필드 변경
  const handleNext = useCallback(
    ({ type, value }: { type: FieldName; value: string | string[] | PetSummaryDto }) => {
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

      if (
        (["father", "mother"].includes(type) && isEggRegister && step < formStep.length - 1) ||
        (!isEggRegister && Number(funnel) === REGISTER_PAGE.FIRST && step <= formStep.length - 1)
      ) {
        goNext(newFormData);
      }
    },
    [formData, funnel, goNext, setFormData, step, isEggRegister, formStep],
  );

  // 선택 리스트 조회
  const getSelectList = useCallback(
    (type: FieldName) => {
      switch (type) {
        case "morphs":
          return MORPH_LIST_BY_SPECIES[formData.species as keyof typeof MORPH_LIST_BY_SPECIES];
        default:
          return SELECTOR_CONFIGS[type as SELECTOR_TYPE].selectList;
      }
    },
    [formData.species],
  );

  // 다중 선택 리스트 오픈
  const handleMultipleSelect = useCallback(
    (type: FieldName) => {
      overlay.open(({ isOpen, close, unmount }) => (
        <MultipleSelector
          isOpen={isOpen}
          onCloseAction={close}
          onSelectAction={(value) => {
            handleNext({ type, value });
            close();
          }}
          selectList={getSelectList(type) || []}
          initialValue={formData[type]}
          onExit={unmount}
        />
      ));
    },
    [getSelectList, handleNext, formData],
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
