"use client";

import { FORM_STEPS, GENDER_KOREAN_INFO, OPTION_STEPS, REGISTER_PAGE } from "../../constants";
import { FormHeader } from "../../components/Form/FormHeader";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { useCallback, useEffect, use, useRef, useState } from "react";
import { FormField } from "../../components/Form/FormField";

import { useSelect } from "../hooks/useSelect";
import { useMutation } from "@tanstack/react-query";
import { CreateParentDtoRole, CreatePetDto, petControllerCreate } from "@repo/api-client";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import Loading from "@/components/common/Loading";
import { isNil, pick, pickBy } from "es-toolkit";
import { BaseFormData } from "../../pet/store/base";
import { useRegisterPetStore } from "../../pet/store/register.pet";
import { overlay } from "overlay-kit";
import Dialog from "../../components/Form/Dialog";
import { cn } from "@/lib/utils";
import FloatingButton from "../../components/FloatingButton";
import { useIsMobile } from "@/hooks/useMobile";

const formatFormData = (formData: BaseFormData): CreatePetDto | undefined => {
  const data = { ...formData };
  if (data.sex && typeof data.sex === "string") {
    const genderEntry = Object.entries(GENDER_KOREAN_INFO).find(
      ([, koreanValue]) => koreanValue === data.sex,
    );
    if (genderEntry) {
      data.sex = genderEntry[0];
    }
  }

  const baseFields = pick(data, ["growth", "morphs", "name", "sex"]);

  const requestData = pickBy(
    {
      desc: data?.desc,
      hatchingDate: data?.hatchingDate,
      weight: data?.weight ? Number(data.weight) : undefined,
      father: data?.father?.petId
        ? {
            parentId: data.father.petId,
            role: CreateParentDtoRole.FATHER,
            isMyPet: false,
            message: data.father?.message,
          }
        : undefined,
      mother: data?.mother?.petId
        ? {
            parentId: data.mother.petId,
            role: CreateParentDtoRole.MOTHER,
            isMyPet: false,
            message: data.mother?.message,
          }
        : undefined,
      foods: data?.foods,
      traits: data?.traits,
      photos: data?.photos,
    },
    (value) => !isNil(value),
  );

  return {
    ...baseFields,
    ...requestData,
    species: data.species,
  };
};

export default function RegisterPage({ params }: { params: Promise<{ funnel: string }> }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { handleSelect } = useSelect();
  const { formData, step, setStep, setFormData, errors, setErrors, resetForm } =
    useRegisterPetStore();

  const resolvedParams = use(params);
  const funnel = Number(resolvedParams.funnel);
  const visibleSteps = FORM_STEPS.slice(-step - 1);
  const nameFieldRef = useRef<HTMLDivElement>(null);
  const [shouldShake, setShouldShake] = useState(false);

  const { mutateAsync: mutateCreatePet, isPending: isCreating } = useMutation({
    mutationFn: petControllerCreate,
  });

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

  useEffect(() => {
    if (funnel === REGISTER_PAGE.SECOND) return;

    const currentStep = FORM_STEPS[FORM_STEPS.length - step - 1];
    if (!currentStep) return;

    const { field } = currentStep;
    if (field.type === "text") {
      const inputElement = document.querySelector(
        `input[name="${field.name}"]`,
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [step, funnel]);

  const handleSuccess = () => {
    toast.success("개체 등록이 완료되었습니다.");
    router.push(`/pet`);
    resetForm();
  };

  const createPet = async (formData: BaseFormData) => {
    try {
      const formattedData = formatFormData(formData);
      if (!formattedData) {
        toast.error("개체 등록에 실패했습니다.");
        return;
      }

      await mutateCreatePet(formattedData);
      handleSuccess();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "개체 등록에 실패했습니다.");
      } else {
        toast.error("개체 등록에 실패했습니다.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const { handleNext, goNext, handleMultipleSelect } = useRegisterForm({
    formStep: FORM_STEPS,
    formData,
    step,
    setErrors,
    setStep,
    setFormData,
    handleSubmit: createPet,
    nameFieldRef,
    setShouldShake,
  });

  const handleReset = useCallback(() => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          resetForm();
          void router.replace("/register/1");
          toast.success("입력 내용이 초기화되었습니다.");
          close();
        }}
        title="입력 내용 초기화"
        description="입력된 모든 내용이 사라집니다. 계속하시겠습니까?"
        onExit={unmount}
      />
    ));
  }, [resetForm, router]);

  if (isCreating) {
    return <Loading />;
  }

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
                    handleMultipleSelect={handleMultipleSelect}
                  />
                </div>
              );
            })}
          </>
        )}

        {funnel === REGISTER_PAGE.SECOND && (
          <>
            {OPTION_STEPS.map((step) => {
              const isNameField = step.field.name === "name";
              const NameFieldClassName = isNameField
                ? "mt-8 border-gray-700 rounded-2xl border-[1.5px] p-6 dark:border-gray-300"
                : "";

              const nameLabelClassName = isNameField
                ? "font-semibold text-gray-800 dark:text-gray-300"
                : "";

              return (
                <div
                  key={step.title}
                  ref={isNameField ? nameFieldRef : null}
                  className={cn(
                    "mb-6 space-y-2",
                    NameFieldClassName,
                    shouldShake && isNameField && "animate-shake",
                  )}
                >
                  <div key={step.field.name}>
                    <FormField
                      field={step.field}
                      handleChange={handleNext}
                      formData={formData}
                      errors={errors}
                      label={
                        isNameField ? (
                          <span className={nameLabelClassName}>{step.title} *</span>
                        ) : (
                          step.title
                        )
                      }
                      handleMultipleSelect={handleMultipleSelect}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}

        <FloatingButton
          leftButton={{
            title: "초기화",
            onClick: () => handleReset(),
          }}
          rightButton={{
            title: funnel === REGISTER_PAGE.SECOND ? "완료" : "다음",
            onClick: () => goNext(),
          }}
          className={cn(!isMobile && "mr-[55px]")}
        />
      </form>
    </div>
  );
}
