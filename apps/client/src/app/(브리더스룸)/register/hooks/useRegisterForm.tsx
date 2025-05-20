import { useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FieldName, FormData, FormErrors } from "../types";
import {
  FORM_STEPS,
  GENDER_KOREAN_INFO,
  MORPH_LIST_BY_SPECIES,
  REGISTER_PAGE,
  SELECTOR_CONFIGS,
} from "../../constants";
import { useFormStore } from "../store/form";
import { overlay } from "overlay-kit";
import MultipleSelector from "../../components/selector/multiple";
import Selector from "../../components/selector";
import { CreatePetDto, petControllerCreate } from "@repo/api-client";
import { useMutation } from "@tanstack/react-query";
import Dialog from "../../components/Form/Dialog";
import { toast } from "sonner";
import { AxiosError } from "axios";

type SELECTOR_TYPE = "species" | "growth" | "sex";

export const useRegisterForm = () => {
  const router = useRouter();
  const { funnel } = useParams();
  const { step, formData, setErrors, setStep, setFormData, resetForm } = useFormStore();
  const { mutate: mutateCreatePet } = useMutation({
    mutationFn: (data: CreatePetDto) => petControllerCreate(data),
    onSuccess: () => {
      toast.success("개체 등록이 완료되었습니다.");
      router.push(`/pet`);
      resetForm();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Failed to create pet:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("개체 등록에 실패했습니다.");
      }
    },
  });

  const validateStep = useCallback(
    (data: FormData) => {
      const newErrors: FormErrors = {};
      let isValid = true;

      Object.entries(data).forEach(([key, value]) => {
        const field = FORM_STEPS.find((step) => step.field.name === key);
        if (field) {
          if (field.field.required && !value.length) {
            newErrors[key] = "필수 입력 항목입니다.";
            isValid = false;
          } else if (field.field.validation && !field.field.validation(value as string)) {
            newErrors[key] = "유효하지 않은 값입니다.";
            isValid = false;
          }
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [setErrors],
  );

  const createPet = useCallback(
    (formData: FormData) => {
      const transformedFormData = { ...formData };
      if (transformedFormData.sex && typeof transformedFormData.sex === "string") {
        const genderEntry = Object.entries(GENDER_KOREAN_INFO).find(
          ([_, koreanValue]) => koreanValue === transformedFormData.sex,
        );
        if (genderEntry) {
          transformedFormData.sex = genderEntry[0];
        }
      }

      const { father, mother, photo, weight, ...rest } = transformedFormData;

      const requestData: CreatePetDto = {
        ...rest,
        ...(weight && { weight: Number(weight) }),
        ...(father?.petId && { fatherId: father.petId }),
        ...(mother?.petId && { motherId: mother.petId }),
      };

      mutateCreatePet(requestData);
    },
    [mutateCreatePet],
  );

  const goNext = useCallback(
    async (newFormData = formData) => {
      if (Number(funnel) === REGISTER_PAGE.SECOND && validateStep(newFormData)) {
        createPet(newFormData);
        return;
      }

      if (step === FORM_STEPS.length && validateStep(newFormData)) {
        router.push("/register/2");
        return;
      }

      if (step + 1 === Object.keys(newFormData).length && validateStep(newFormData)) {
        setStep(step + 1);
      }
    },
    [step, validateStep, setStep, formData, router, createPet, funnel],
  );

  const handleNext = useCallback(
    ({ type, value }: { type: FieldName; value: string | string[] }) => {
      if (
        type === "species" &&
        formData.species !== value &&
        Array.isArray(formData.morphs) &&
        formData.morphs.length > 0
      ) {
        overlay.open(({ isOpen, close }) => (
          <Dialog
            isOpen={isOpen}
            onCloseAction={close}
            onConfirmAction={() => {
              setFormData((prev) => ({ ...prev, species: value as string, morphs: [] }));
              close();
            }}
            title="종 변경 안내"
            description={`종을 변경하면 선택된 모프가 초기화됩니다. \n 계속하시겠습니까?`}
          />
        ));
        return;
      }

      const newFormData = { ...formData, [type]: value };
      setFormData(newFormData);

      if (Number(funnel) === REGISTER_PAGE.FIRST) {
        goNext(newFormData);
      }
    },
    [formData, funnel, goNext, setFormData],
  );

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

  const handleMultipleSelect = useCallback(
    (type: FieldName) => {
      overlay.open(({ isOpen, close }) => (
        <MultipleSelector
          isOpen={isOpen}
          onCloseAction={close}
          onSelectAction={(value) => {
            handleNext({ type, value });
            close();
          }}
          selectList={getSelectList(type) || []}
          initialValue={formData[type]}
        />
      ));
    },
    [getSelectList, handleNext, formData],
  );

  const handleSelect = useCallback(
    (type: SELECTOR_TYPE) => {
      const config = SELECTOR_CONFIGS[type];

      overlay.open(({ isOpen, close }) => (
        <Selector
          isOpen={isOpen}
          onCloseAction={close}
          onSelectAction={(value) => {
            handleNext({ type, value });
            close();
          }}
          selectList={config.selectList}
          title={config.title}
          currentValue={formData[type]}
          type={type}
        />
      ));
    },
    [formData, handleNext],
  );

  return useMemo(
    () => ({
      handleNext,
      goNext,
      handleSelect,
      handleMultipleSelect,
    }),
    [handleNext, goNext, handleSelect, handleMultipleSelect],
  );
};
