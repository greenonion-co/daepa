import { FormData } from "@/app/(브리더스룸)/register/store/pet";
import { FormErrors } from "@/app/(브리더스룸)/register/types";
import { FormStep } from "@/app/(브리더스룸)/register/types";

export const validateStep = ({
  formStep,
  data,
  currentStep,
}: {
  formStep: FormStep[];
  data: FormData;
  currentStep: number;
}) => {
  const newErrors: FormErrors = {};
  let isValid = true;

  // 현재 단계까지의 모든 필드 검사
  const stepsToValidate = formStep.slice(-currentStep - 1);

  stepsToValidate.forEach((step) => {
    const { field } = step;

    const value = data[field.name];

    if (field.required && !value?.length) {
      newErrors[field.name] = "필수 입력 항목입니다.";
      isValid = false;
    } else if (field.validation && !field.validation(value as string)) {
      newErrors[field.name] = "유효하지 않은 값입니다.";
      isValid = false;
    }
  });

  return {
    errors: newErrors,
    isValid,
  };
};
