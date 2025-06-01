"use client";

import { EGG_REGISTER_STEPS, USER_NAME } from "../../constants";
import {
  CreateEggDto,
  CreateParentDto,
  eggControllerCreate,
  PetSummaryDto,
} from "@repo/api-client";
import { FormField } from "../../components/Form/FormField";
import { useState } from "react";
import { FieldName, FormErrors, FormStep } from "../types";
import FloatingButton from "../../components/FloatingButton";
import { cn, formatDateToYYYYMMDD } from "@/lib/utils";
import { Check, InfoIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
type FormData = {
  species: null | string;
  layingDate: string;
  father?: CreateParentDto & { petId: string; name: string };
  mother?: CreateParentDto & { petId: string; name: string };
  clutch?: number;
  clutchCount: number;
  desc?: string;
};

const EggRegisterPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    species: null,
    layingDate: "",
    clutchCount: 0,
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const visibleSteps = EGG_REGISTER_STEPS.slice(-step - 1);

  const { mutate: createEgg } = useMutation({
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

  const handleChange = ({
    type,
    value,
  }: {
    type: FieldName;
    value: string | string[] | PetSummaryDto | null;
  }) => {
    const newFormData = { ...formData, [type]: value };
    setFormData(newFormData);

    if (["layingDate", "species"].includes(type)) {
      handleNext();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleNext = () => {
    // const { errors, isValid } = validateStep(formData, EGG_REGISTER_STEPS);
    // setErrors(errors);
    // if (!isValid) return;

    if (step >= EGG_REGISTER_STEPS.length - 1) {
      createEgg({
        species: formData.species,
        layingDate: formatDateToYYYYMMDD(formData.layingDate ?? ""),
        ...(formData.father?.petId && {
          father: {
            parentId: formData.father.petId,
            role: "father",
            // TODO: 로그인/회원가입 후 수정
            isMyPet: false,
            message: formData.father?.message ?? "",
          },
        }),
        ...(formData.mother?.petId && {
          mother: {
            parentId: formData.mother.petId,
            role: "mother",
            // TODO: 로그인/회원가입 후 수정
            isMyPet: false,
            message: formData.mother?.message ?? "",
          },
        }),
        clutch: Number(formData.clutch),
        clutchCount: Number(formData.clutchCount),
        desc: formData.desc,
      });
      return;
    }

    setStep(step + 1);
  };

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
                handleChange={handleChange}
                formData={formData}
                label={step.title}
              />
              {errors[step.field.name] && (
                <div className="mt-1 flex items-center gap-1">
                  <InfoIcon className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-500">{errors[step.field.name]}</p>
                </div>
              )}
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
