"use client";

import { FORM_STEPS, OPTION_STEPS, REGISTER_PAGE } from "../../constants";
import { FormHeader } from "../../components/Form/FormHeader";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { useFormStore } from "../store/form";
import InfoOutline from "@mui/icons-material/InfoOutline";
import { useEffect, use } from "react";
import { FormField } from "../../components/Form/FormField";
import Dialog from "../../components/Form/Dialog";
import { overlay } from "overlay-kit";
import { useSearchParams } from "next/navigation";
import FloatingButton from "../../components/FloatingButton";

export default function RegisterPage({ params }: { params: Promise<{ funnel: string }> }) {
  const { handleNext, goNext, handleSelect, handleMultipleSelect } = useRegisterForm();
  const { formData, step, errors, resetForm } = useFormStore();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const resolvedParams = use(params);
  const funnel = Number(resolvedParams.funnel);
  const visibleSteps = FORM_STEPS.slice(-step - 1);

  useEffect(() => {
    // 작성 중인 정보가 있는 경우 모달 띄우기
    if (from === "register") return;

    if (Object.keys(formData).length > 0) {
      overlay.open(({ isOpen, close, unmount }) => (
        <Dialog
          isOpen={isOpen}
          onConfirmAction={close}
          onCloseAction={() => {
            resetForm();
            close();
          }}
          title="등록"
          description="작성 중인 정보가 있습니다. 계속 진행하시겠습니까?"
          onExit={unmount}
        />
      ));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                  <h2 className="text-gray-500">{title}</h2>
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
