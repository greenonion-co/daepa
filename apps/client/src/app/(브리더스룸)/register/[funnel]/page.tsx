"use client";

import { FORM_STEPS, GENDER_KOREAN_INFO, OPTION_STEPS, REGISTER_PAGE } from "../../constants";
import { FormHeader } from "../../components/Form/FormHeader";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { FormData, usePetStore } from "../store/pet";
import { useEffect, use } from "react";
import { FormField } from "../../components/Form/FormField";

import FloatingButton from "../../components/FloatingButton";
import { useSelect } from "../hooks/useSelect";
import { useMutation } from "@tanstack/react-query";
import { CreatePetDto, petControllerCreate } from "@repo/api-client";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import Loading from "@/components/common/Loading";
import { format } from "date-fns";

export default function RegisterPage({ params }: { params: Promise<{ funnel: string }> }) {
  const router = useRouter();
  const { handleSelect } = useSelect();
  const { formData, step, setStep, setFormData, errors, setErrors, resetForm, page, setPage } =
    usePetStore();
  const resolvedParams = use(params);
  const funnel = Number(resolvedParams.funnel);
  const visibleSteps = FORM_STEPS.slice(-step - 1);

  const { mutate: mutateCreatePet, isPending } = useMutation({
    mutationFn: (data: CreatePetDto) => petControllerCreate(data),
    onSuccess: () => {
      toast.success("개체 등록이 완료되었습니다.");
      router.push(`/pet`);
      resetForm();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Failed to create pet:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("개체 등록에 실패했습니다.");
      }
    },
  });

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

  const createPet = (formData: FormData) => {
    try {
      const transformedFormData = { ...formData };
      if (transformedFormData.sex && typeof transformedFormData.sex === "string") {
        const genderEntry = Object.entries(GENDER_KOREAN_INFO).find(
          ([_, koreanValue]) => koreanValue === transformedFormData.sex,
        );
        if (genderEntry) {
          transformedFormData.sex = genderEntry[0];
        }
      }

      const { growth, morphs, name, sex, species, ...rest } = transformedFormData;

      const requestData: CreatePetDto = {
        growth,
        morphs,
        name,
        sex,
        species,
        ...(rest?.birthdate && {
          birthdate: format(rest.birthdate, "yyyyMMdd"),
        }),
        ...(rest?.weight && { weight: Number(rest.weight) }),
        ...(rest?.father?.petId && {
          father: {
            parentId: rest.father.petId,
            role: "father",
            isMyPet: false,
            message: rest.father?.message,
          },
        }),
        ...(rest?.mother?.petId && {
          mother: {
            parentId: rest.mother.petId,
            role: "mother",
            isMyPet: false,
            message: rest.mother?.message,
          },
        }),
      };

      mutateCreatePet(requestData);
    } catch (error) {
      console.error("Failed to create pet:", error);
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
  });

  if (isPending) {
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
            {OPTION_STEPS.map((step) => (
              <div key={step.title} className="mb-6 space-y-2">
                <div key={step.field.name}>
                  <FormField
                    field={step.field}
                    handleChange={handleNext}
                    formData={formData}
                    errors={errors}
                    label={step.title}
                    handleMultipleSelect={handleMultipleSelect}
                  />
                </div>
              </div>
            ))}
          </>
        )}
        <FloatingButton
          label={funnel === REGISTER_PAGE.SECOND ? "완료" : "다음"}
          onClick={() => goNext()}
        />
      </form>
    </div>
  );
}
