import { useState } from "react";
import { FormData, FormErrors } from "../types";
import { FORM_STEPS, REGISTER_PAGE } from "../../constants";
import { useFormStore } from "../store/form";

export const useRegisterForm = () => {
  const { formData } = useFormStore();
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentPage, setCurrentPage] = useState(REGISTER_PAGE.FIRST);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const validateStep = (data: FormData) => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.entries(data).forEach(([key, value]) => {
      const field = FORM_STEPS.find((step) => step.fields.name === key);
      if (field) {
        if (field.fields.required && !value) {
          newErrors[key] = "필수 입력 항목입니다.";
          isValid = false;
        } else if (field.fields.validation && !field.fields.validation(value as string)) {
          newErrors[key] = "유효하지 않은 값입니다.";
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = (data: FormData) => {
    if (currentPage === REGISTER_PAGE.SECOND) {
      console.log("등록하기");
      return false;
    }

    if (
      !validateStep(data) ||
      currentStep !== Object.keys(data).length - 1 ||
      FORM_STEPS.length === Object.keys(data).length
    )
      return false;

    setCompletedSteps((prev) => [...prev, currentStep]);
    setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1));
    setErrors({});
    return true;
  };

  const handleNextClick = () => {
    if (!validateStep(formData)) return;

    if (currentStep === FORM_STEPS.length - 1) {
      setCurrentPage(REGISTER_PAGE.SECOND);
    } else {
      handleNext(formData);
    }
  };

  return {
    currentPage,
    setCurrentPage,
    errors,
    currentStep,
    completedSteps,
    validateStep,
    handleNext,
    handleNextClick,
  };
};
