"use client";

import { EGG_REGISTER_STEPS, USER_NAME } from "../../../constants";
import { CreateEggDto, eggControllerCreate } from "@repo/api-client";
import { FormField } from "../../../components/Form/FormField";

import { cn, formatDateToYYYYMMDD } from "@/lib/utils";
import { Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { FormStep } from "../../types";
import FloatingButton from "@/app/(브리더스룸)/components/FloatingButton";
import { useEggStore } from "../../store/egg";
import { useRegisterForm } from "../../hooks/useRegisterForm";
import { useEffect } from "react";
import { useSelect } from "../../hooks/useSelect";
import { FormData } from "../../store/pet";

const EggRegisterPage = () => {
  const router = useRouter();
  const { formData, setFormData, step, setStep, errors, setErrors, page, setPage, resetForm } =
    useEggStore();
  const { handleSelect } = useSelect();
  const visibleSteps = EGG_REGISTER_STEPS.slice(-step - 1);

  const { mutate: mutateCreateEgg } = useMutation({
    mutationFn: (data: CreateEggDto) => eggControllerCreate(data),
    onSuccess: () => {
      toast.success("알 등록이 완료되었습니다.");
      router.push("/hatching");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Failed to create pet:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("알 등록에 실패했습니다.");
      }
    },
  });

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    const currentStep = EGG_REGISTER_STEPS[EGG_REGISTER_STEPS.length - step - 1];
    if (!currentStep) return;

    const { field } = currentStep;
    if (formData[field.name]) return;

    if (field.type === "select") {
      handleSelect({
        type: field.name,
        value: formData[field.name],
        handleNext,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const createEgg = (newFormData: FormData) => {
    if (!newFormData?.father?.petId || !newFormData?.mother?.petId) {
      toast.error("부모 개체 정보를 하나 이상 선택해주세요.");

      return;
    }

    try {
      const formattedData = {
        species: newFormData.species,
        layingDate: formatDateToYYYYMMDD(newFormData.layingDate ?? ""),
        ...(newFormData.father?.petId && {
          father: {
            parentId: newFormData.father.petId,
            role: "father",
            // TODO: 로그인/회원가입 후 수정
            isMyPet: false,
            message: newFormData.father?.message ?? "",
          },
        }),
        ...(newFormData.mother?.petId && {
          mother: {
            parentId: newFormData.mother.petId,
            role: "mother",
            // TODO: 로그인/회원가입 후 수정
            isMyPet: false,
            message: newFormData.mother?.message ?? "",
          },
        }),

        ...(newFormData.clutch && { clutch: Number(newFormData.clutch) }),
        clutchCount: Number(newFormData.clutchCount),
        desc: newFormData.desc,
      };
      mutateCreateEgg(formattedData);
    } catch (error) {
      console.error("Failed to create egg:", error);
    }
  };

  const { handleNext, goNext } = useRegisterForm({
    formStep: EGG_REGISTER_STEPS,
    formData,
    step,
    setErrors,
    setStep,
    setFormData,
    handleSubmit: createEgg,
  });

  return (
    <div className="relative mx-auto min-h-screen max-w-[640px] p-4 pb-20">
      <div className={"mb-8 text-2xl"}>
        <span className="relative font-bold after:absolute after:bottom-0 after:left-0 after:-z-10 after:h-[15px] after:w-full after:bg-[#247DFE] after:opacity-20">
          {USER_NAME}
        </span>
        님 <span className="font-bold text-sky-700">알</span>의
        <br />
        <span>등록 정보를 입력해주세요.</span>
        <StepIndicator steps={EGG_REGISTER_STEPS} formData={formData} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {visibleSteps.map((step) => (
          <div key={step.title} className="mb-6 space-y-2">
            <div key={step.field.name}>
              <FormField
                field={step.field}
                handleChange={handleNext}
                formData={formData}
                label={step.title}
                errors={errors}
              />
            </div>
          </div>
        ))}

        <FloatingButton
          label={step === EGG_REGISTER_STEPS.length - 1 ? "등록" : "다음"}
          onClick={() => goNext()}
        />
      </form>
    </div>
  );
};

export default EggRegisterPage;

const StepIndicator = ({ steps, formData }: { steps: FormStep[]; formData: FormData }) => {
  const isCompleted = (stepId: string) => {
    switch (stepId) {
      case "layingDate":
        return !!formData.layingDate;
      case "species":
        return !!formData.species;
      case "parents":
        return !!(formData.father || formData.mother);
      case "clutchCount":
        return !!formData.clutchCount;
      case "clutch":
        return !!formData.clutch;
      case "desc":
        return !!formData.desc;
      default:
        return false;
    }
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {[...steps].reverse().map((step) => (
        <div key={step.title} className="flex items-center">
          <div>
            <Check
              size={16}
              className={isCompleted(step.field.name) ? "text-green-500" : "text-gray-200"}
            />
          </div>
          <div
            className={cn(
              "ml-1 text-sm text-gray-500",
              isCompleted(step.field.name) && "text-green-500",
            )}
          >
            {step.title}
          </div>
        </div>
      ))}
    </div>
  );
};
