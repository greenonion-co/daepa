import { FormErrors } from "@/app/(브리더스룸)/register/types";
import { FormStep } from "@/app/(브리더스룸)/register/types";

export const validateStep = (data: any, formSteps: FormStep[]) => {
  const errors: FormErrors = {};
  let isValid = true;

  Object.entries(data).forEach(([key, value]) => {
    const field = formSteps.find((step) => step.field.name === key);
    if (field) {
      if (field.field.required && !value?.length) {
        errors[key] = "필수 입력 항목입니다.";
        isValid = false;
      } else if (field.field.validation && !field.field.validation(value as string)) {
        errors[key] = "유효하지 않은 값입니다.";
        isValid = false;
      }
    }
  });

  return { errors, isValid };
};
