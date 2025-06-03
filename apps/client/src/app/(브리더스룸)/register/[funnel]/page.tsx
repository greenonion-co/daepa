"use client";

import { FORM_STEPS, OPTION_STEPS, REGISTER_PAGE } from "../../constants";
import { FormHeader } from "../../components/Form/FormHeader";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { useFormStore } from "../store/form";
import { useEffect, use } from "react";
import { FormField } from "../../components/Form/FormField";

import FloatingButton from "../../components/FloatingButton";
import { InfoIcon } from "lucide-react";
import { useSelect } from "../hooks/useSelect";

export default function RegisterPage({ params }: { params: Promise<{ funnel: string }> }) {
  const { handleNext, goNext, handleMultipleSelect } = useRegisterForm();
  const { handleSelect } = useSelect();
  const { formData, step, errors, resetForm, page, setPage } = useFormStore();
  const resolvedParams = use(params);
  const funnel = Number(resolvedParams.funnel);
  const visibleSteps = FORM_STEPS.slice(-step - 1);

  useEffect(() => {
    if (page !== "register") {
      setPage("register");
      resetForm();
    }
  }, [page, resetForm, setPage]);

  useEffect(() => {
    if (funnel === REGISTER_PAGE.SECOND) return;

    const currentStep = FORM_STEPS[FORM_STEPS.length - step - 1];
    if (!currentStep) return;

    const { field } = currentStep;
    if (formData[field.name]) return;

    if (field.type === "select") {
      handleSelect({
        type: field.name,
        value: formData[field.name],
        handleNext,
      });
    } else if (field.type === "multipleSelect") {
      handleMultipleSelect(field.name);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-[640px] p-4 pb-20">
      <FormHeader funnel={funnel} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {funnel === REGISTER_PAGE.FIRST && (
          <>
            {visibleSteps.map((step) => {
              const { title, field } = step;
              return (
                <div key={title}>
                  <h2 className="text-gray-500">{title}</h2>
                  <FormField
                    field={field}
                    handleChange={handleNext}
                    formData={formData}
                    errors={errors}
                  />
                  {errors[field.name] && (
                    <div className="mt-1 flex items-center gap-1">
                      <InfoIcon className="h-4 w-4 text-red-500" />
                      <p className="text-sm text-red-500">{errors[field.name]}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {funnel === REGISTER_PAGE.SECOND && (
          <>
            {OPTION_STEPS.map((step) => (
              <div key={step.title} className="mb-6 space-y-2">
                <div key={step.field.name}>
                  <FormField
                    field={step.field}
                    handleChange={handleNext}
                    formData={formData}
                    errors={errors}
                    label={step.title}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </form>

      <FloatingButton
        label={funnel === REGISTER_PAGE.SECOND ? "완료" : "다음"}
        onClick={() => goNext()}
      />
    </div>
  );
}
