"use client";

import { EGG_REGISTER_STEPS, USER_NAME } from "../../constants";
import { PetSummaryDto } from "@repo/api-client";
import { FormField } from "../../components/Form/FormField";
import { useState } from "react";
import { FieldName, FormErrors } from "../types";
import FloatingButton from "../../components/FloatingButton";

const EggRegisterPage = () => {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState(0);
  console.log("🚀 ~ EggRegisterPage ~ step:", { step, length: EGG_REGISTER_STEPS.length });
  const visibleSteps = EGG_REGISTER_STEPS.slice(-step - 1);

  const handleChange = ({
    type,
    value,
  }: {
    type: FieldName;
    value: string | string[] | PetSummaryDto | null;
  }) => {
    setFormData((prev) => ({ ...prev, [type]: value }));
    if (type === "birthdate") {
      handleNext({ type, value });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleNext = ({
    type,
    value,
  }: {
    type: FieldName;
    value: string | string[] | PetSummaryDto | null;
  }) => {
    if (step >= EGG_REGISTER_STEPS.length - 1) return;

    setStep(step + 1);
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-[640px] p-4 pb-20">
      <div className="mb-8 text-2xl">
        <span className="relative font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:bg-[#247DFE] after:opacity-20">
          {USER_NAME}
        </span>
        님 <span className="font-bold text-sky-700">알</span>의
        <br />
        <span>등록 정보를 입력해주세요.</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {visibleSteps.map((step) => (
          <div key={step.title} className="mb-6 space-y-2">
            <div key={step.field.name}>
              <FormField
                field={step.field}
                handleChange={handleChange}
                formData={formData}
                errors={errors}
                label={step.title}
              />
            </div>
          </div>
        ))}

        <FloatingButton
          label={step === EGG_REGISTER_STEPS.length - 1 ? "등록" : "다음"}
          onClick={handleNext}
          // disabled={!formData[visibleSteps[step].field.name]}
        />
      </form>
    </div>
  );
};

export default EggRegisterPage;
