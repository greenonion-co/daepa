"use client";

import { useState, useEffect } from "react";
import { FORM_STEPS, OPTION_STEPS, REGISTER_PAGE, SELECTOR_CONFIGS } from "../constants";
import { FormData, FormStep } from "./types";
import { useSelector } from "./hooks";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { FormHeader } from "./components/Form/FormHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import StepForm from "./components/StepForm";
import { useRegisterForm } from "./hooks/useRegisterForm";
import FileField from "./components/Form/FileField";
import NumberField from "./components/Form/NumberField";
import MorphField from "./components/Form/MorphField";
import { useFormStore } from "./store/form";
import ParentsField from "./components/Form/ParentsField";

export default function RegisterPage() {
  const { openSelector, openMorphSelector } = useSelector();
  const { state, isMobile } = useSidebar();
  const {
    errors,
    currentStep,
    currentPage,
    completedSteps,
    validateStep,
    handleNext,
    handleNextClick,
  } = useRegisterForm();

  const { formData, setFormData } = useFormStore();

  const [showMorphResetAlert, setShowMorphResetAlert] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const currentStepData = FORM_STEPS[currentStep] as FormStep;

  const handleSelectorOpen = (selectorType: keyof typeof SELECTOR_CONFIGS) => {
    const config = SELECTOR_CONFIGS[selectorType];
    if (!config) return;

    openSelector({
      title: config.title,
      selectList: config.selectList,
      currentValue: formData[selectorType as keyof FormData] as string,
      onSelect: (value) => {
        if (selectorType === "species" && !handleSpeciesSelect(value)) return;

        const newFormData = { ...formData, [selectorType]: value };
        setFormData(newFormData);
        if (selectorType !== "gender") {
          handleNext(newFormData);
        }
      },
    });
  };

  const handleMorphSelectorOpen = () => {
    openMorphSelector({
      species: formData.species as string,
      currentMorphs: Array.isArray(formData.morph) ? formData.morph : [],
      onSelect: (morphs) => {
        const newFormData = { ...formData, morph: morphs };
        setFormData(newFormData);
        handleNext(newFormData);
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(formData)) {
      console.log("Form submitted:", formData);
    }
  };

  const handleSpeciesSelect = (newSpecies: string): boolean => {
    if (
      formData.species !== newSpecies &&
      formData.morph &&
      Array.isArray(formData.morph) &&
      formData.morph.length > 0
    ) {
      setShowMorphResetAlert(true);
      setSelectedSpecies(newSpecies);
      return false;
    }
    return true;
  };

  const handleMorphReset = () => {
    setFormData((prev) => ({ ...prev, species: selectedSpecies || "", morph: [] }));
    setShowMorphResetAlert(false);
    setSelectedSpecies(null);
  };

  const handleMorphResetCancel = () => {
    setShowMorphResetAlert(false);
  };

  useEffect(() => {
    if (currentPage === REGISTER_PAGE.FIRST) {
      switch (currentStep) {
        case 1:
          handleMorphSelectorOpen();
          break;
        default:
          handleSelectorOpen(FORM_STEPS[currentStep]?.fields.name as keyof FormData);
          break;
      }
    }
  }, [currentStep]);

  const renderField = (field: FormStep["fields"]) => {
    const value = formData[field.name as keyof FormData] || "";
    const error = errors[field.name];

    const inputClassName = `text-[20px] w-full border-b-[1.2px] border-b-gray-200 h-9 pr-1 text-left focus:outline-none focus:ring-0 ${error && "border-b-red-500"}`;

    switch (field.type) {
      case "select":
        return (
          <button
            type="button"
            className={inputClassName + `${value ? "font-semibold" : "text-gray-400"}`}
            onClick={() => handleSelectorOpen(field.name)}
          >
            {value || field.placeholder}
          </button>
        );
      case "textarea":
        return (
          <textarea
            className={`w-full rounded-xl bg-gray-100 p-4 text-left text-[20px] focus:outline-none focus:ring-0`}
            rows={4}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
          />
        );
      case "file":
        return <FileField />;
      case "morph":
        return (
          <MorphField
            inputClassName={inputClassName}
            handleMorphSelectorOpen={handleMorphSelectorOpen}
          />
        );
      case "number":
        return <NumberField inputClassName={inputClassName} field={field} value={value} />;
      case "parentSearch":
        return <ParentsField />;
      default:
        return (
          <input
            type={field.type}
            className={inputClassName}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
          />
        );
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 py-8">
      <FormHeader />

      {currentPage === REGISTER_PAGE.FIRST && (
        <StepForm
          currentStep={currentStep}
          completedSteps={completedSteps}
          currentStepData={currentStepData}
          renderField={renderField}
          errors={errors}
          handleSubmit={handleSubmit}
        />
      )}

      {currentPage === REGISTER_PAGE.SECOND && (
        <form className="mb-20 space-y-4">
          {OPTION_STEPS.map((step) => (
            <div key={step.title} className="mb-6 space-y-2">
              <h2 className="text-lg text-gray-500">{step.title}</h2>
              <div key={step.fields.name}>{renderField(step.fields)}</div>
            </div>
          ))}
        </form>
      )}

      <AlertDialog open={showMorphResetAlert}>
        <AlertDialogContent>
          <AlertDialogTitle>종 변경 안내</AlertDialogTitle>
          <AlertDialogDescription>
            종을 변경하면 선택된 모프가 초기화됩니다.
            <br />
            계속하시겠습니까?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleMorphResetCancel}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleMorphReset}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white p-4",
          !isMobile && state === "expanded" && "ml-[255px]",
        )}
      >
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleNextClick}
            className="h-12 w-full cursor-pointer rounded-2xl bg-[#247DFE] text-lg font-bold text-white"
          >
            {currentPage === REGISTER_PAGE.SECOND ? "등록하기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
