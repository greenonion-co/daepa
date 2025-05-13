import { useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FieldName, FormData, FormErrors } from "../types";
import { FORM_STEPS, REGISTER_PAGE } from "../../constants";
import { useFormStore } from "../store/form";

export const useRegisterForm = () => {
  const router = useRouter();
  const { funnel } = useParams();
  const {
    step,
    formData,
    selectedSpecies,
    setErrors,
    setStep,
    setShowMorphResetAlert,
    setSelectedSpecies,
    setFormData,
  } = useFormStore();

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

  const resetMorph = useCallback(() => {
    setFormData((prev) => ({ ...prev, species: selectedSpecies || "", morph: [] }));
    setShowMorphResetAlert(false);
    setSelectedSpecies(null);
  }, [setFormData, setShowMorphResetAlert, setSelectedSpecies, selectedSpecies]);

  const handleSpeciesSelect = useCallback(
    (newSpecies: string): boolean => {
      if (
        formData.species !== newSpecies &&
        Array.isArray(formData.morph) &&
        formData.morph.length > 0
      ) {
        setShowMorphResetAlert(true);
        setSelectedSpecies(newSpecies);
        return false;
      }
      return true;
    },
    [formData.species, formData.morph, setShowMorphResetAlert, setSelectedSpecies],
  );

  const goNext = useCallback(
    (newFormData = formData) => {
      if (step === FORM_STEPS.length && validateStep(newFormData)) {
        router.push("/register/2");
        return;
      }

      if (step + 1 === Object.keys(newFormData).length && validateStep(newFormData)) {
        setStep(step + 1);
      }
    },
    [step, validateStep, setStep, formData, router],
  );

  const handleNext = useCallback(
    ({ type, value }: { type: FieldName; value: string | string[] }) => {
      if (type === "species") {
        const canProceed = handleSpeciesSelect(value as string);
        if (!canProceed) {
          return;
        }
      }

      const newFormData = { ...formData, [type]: value };
      setFormData(newFormData);

      if (Number(funnel) === REGISTER_PAGE.FIRST) {
        goNext(newFormData);
      }
    },
    [formData, funnel, handleSpeciesSelect, goNext, setFormData],
  );

  return useMemo(
    () => ({
      handleNext,
      goNext,
      resetMorph,
    }),
    [handleNext, goNext, resetMorph],
  );
};
