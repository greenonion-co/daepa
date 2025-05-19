"use client";

import { cn } from "@/lib/utils";
import { FORM_STEPS, OPTION_STEPS, REGISTER_PAGE } from "../../constants";
import { FormHeader } from "../../components/Form/FormHeader";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { useFormStore } from "../store/form";
import InfoOutline from "@mui/icons-material/InfoOutline";
import SubmitButton from "../../components/Form/SubmitButton";
import { useEffect, use } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { FormField } from "../../components/Form/FormField";

export default function RegisterPage({ params }: { params: Promise<{ funnel: string }> }) {
  const { handleNext, goNext, handleSelect, handleMultipleSelect } = useRegisterForm();
  const { formData, step, errors } = useFormStore();
  const { state, isMobile } = useSidebar();

  const resolvedParams = use(params);
  const funnel = Number(resolvedParams.funnel);
  const visibleSteps = FORM_STEPS.slice(-step - 1);

  useEffect(() => {
    if (funnel === REGISTER_PAGE.SECOND) return;
    const currentStep = FORM_STEPS[FORM_STEPS.length - step - 1];
    if (!currentStep) return;

    const { field } = currentStep;
    if (formData[field.name]) return;

    if (field.type === "select") {
      handleSelect(field.name);
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
                  <h2 className="text-lg text-gray-500">{title}</h2>
                  <FormField
                    field={field}
                    handleChange={handleNext}
                    formData={formData}
                    errors={errors}
                  />
                  {errors[field.name] && (
                    <div className="flex items-center gap-1">
                      <InfoOutline fontSize="small" className="text-red-500" />
                      <p className="text-sm font-semibold text-red-500">{errors[field.name]}</p>
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
                <h2 className="text-lg text-gray-500">{step.title}</h2>
                <div key={step.field.name}>
                  <FormField
                    field={step.field}
                    handleChange={handleNext}
                    formData={formData}
                    errors={errors}
                    handleSelect={handleSelect}
                    handleMultipleSelect={handleMultipleSelect}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </form>

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] dark:bg-black",
          !isMobile && state === "expanded" && "ml-[255px]",
        )}
      >
        <div className="mx-auto max-w-[640px]">
          <SubmitButton
            label={funnel === REGISTER_PAGE.SECOND ? "완료" : "다음"}
            onClick={() => goNext()}
          />
        </div>
      </div>
    </div>
  );
}
