import { FormField } from "@/app/(브리더스룸)/components/Form/FormField";
import { FORM_STEPS, OPTION_STEPS } from "@/app/(브리더스룸)/constants";
import { useFormStore } from "@/app/(브리더스룸)/register/store/form";
import { FieldName } from "@/app/(브리더스룸)/register/types";
import { Button } from "@/components/ui/button";
import { Edit3, FlipHorizontal } from "lucide-react";
import { useState } from "react";
import ParentLink from "../../components/ParentLink";
import {
  petControllerUpdate,
  PetSummaryDto,
  UpdatePetDto,
  petControllerDelete,
  parentControllerDeleteParent,
  parentControllerCreateParent,
} from "@repo/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import Dialog from "@/app/(브리더스룸)/components/Form/Dialog";
import { useMutation } from "@tanstack/react-query";
interface CardBackProps {
  pet: PetSummaryDto;
  setIsFlipped: (isFlipped: boolean) => void;
}

const CardBack = ({ pet, setIsFlipped }: CardBackProps) => {
  const { formData, errors, setFormData } = useFormStore();
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const { mutate: mutateDeletePet } = useMutation({
    mutationFn: (petId: string) => petControllerDelete(petId),
    onSuccess: () => {
      router.push("/pet");

      toast.success("펫이 삭제되었습니다.");
    },
  });

  const { mutate: mutateDeleteParent } = useMutation({
    mutationFn: ({ target }: { target: "father" | "mother" }) =>
      parentControllerDeleteParent(pet.petId, {
        target,
      }),
  });

  const { mutate: mutateRequestParent } = useMutation({
    mutationFn: ({ parentId, target }: { parentId: string; target: "father" | "mother" }) =>
      parentControllerCreateParent(parentId, {
        parentId,
        target,
      }),
  });

  const visibleFields = [
    ...[...FORM_STEPS].reverse(),
    ...OPTION_STEPS.filter((step) =>
      ["traits", "foods", "birthdate", "weight", "name", "desc"].includes(step.field.name),
    ),
  ];

  const handleChange = (value: { type: FieldName; value: string | string[] | PetSummaryDto }) => {
    if (!isEditing) return;
    setFormData((prev) => ({ ...prev, [value.type]: value.value }));
  };

  const handleSave = async () => {
    try {
      const { petId, ownerId, father, mother, weight, ...restFormData } = formData;

      if (!petId) return;

      const updateData = {
        ...restFormData,
        ...(weight && { weight: Number(weight) }),
        ...(father?.petId && { fatherId: father.petId }),
        ...(mother?.petId && { motherId: mother.petId }),
      };

      await petControllerUpdate(petId, updateData as UpdatePetDto);
      setIsEditing(false);
      toast.success("펫 정보 수정이 완료되었습니다.");
    } catch (error) {
      console.error("Failed to update pet:", error);
      toast.error("펫 정보 수정에 실패했습니다.");
    }
  };

  const handleParentSelect = (label: "father" | "mother", value: PetSummaryDto) => {
    try {
      mutateRequestParent({ parentId: value.petId, target: label });
      setFormData((prev) => ({ ...prev, [label]: value }));

      toast.success("부모 연동 요청이 완료되었습니다.");
    } catch {
      toast.error("부모 연동 요청에 실패했습니다.");
    }
  };

  const deletePet = async () => {
    try {
      if (!pet.petId) return;

      mutateDeletePet(pet.petId);
    } catch {
      toast.error("펫 삭제에 실패했습니다.");
    }
  };

  const handleDelete = () => {
    overlay.open(({ isOpen, close }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          deletePet();
          close();
        }}
        title="개체 삭제 안내"
        description={`정말로 삭제하시겠습니까? \n 삭제 후 복구할 수 없습니다.`}
      />
    ));
  };

  const handleUnlink = (label: "father" | "mother") => {
    try {
      if (!formData[label]?.petId) return;
      mutateDeleteParent({ target: label });

      toast.success("부모 연동 해제가 완료되었습니다.");
      setFormData((prev) => ({ ...prev, [label]: null }));
    } catch {
      toast.error("부모 연동 해제에 실패했습니다.");
    }
  };

  return (
    <div className="absolute h-full w-full [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)]">
      <div
        className="h-full overflow-auto rounded-lg border-4 border-gray-300 bg-white shadow-xl dark:bg-[#18181B]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pl-6 pr-6">
          {/* 혈통 정보 */}
          <div className="pb-4 pt-4">
            <h2 className="mb-3 text-xl font-bold">혈통 정보</h2>

            <div className="grid grid-cols-2 gap-4">
              <ParentLink
                label="부"
                data={formData.father}
                onSelect={(item) => handleParentSelect("father", item)}
                onUnlink={() => handleUnlink("father")}
              />
              <ParentLink
                label="모"
                data={formData.mother}
                onSelect={(item) => handleParentSelect("mother", item)}
                onUnlink={() => handleUnlink("mother")}
              />
            </div>
          </div>

          {/* 사육 정보 */}
          <div>
            <div className="mb-2 flex items-center gap-1">
              <h2 className="text-xl font-bold">사육 정보</h2>

              {/* 수정 버튼 */}
              <div className="sticky top-0 z-10 flex justify-end bg-white p-2 dark:bg-[#18181B]">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-8 rounded-xl"
                      onClick={() => {
                        setFormData(pet);
                        setIsEditing(false);
                      }}
                    >
                      취소
                    </Button>
                    <Button className="h-8 rounded-xl bg-[#1A56B3]" onClick={handleSave}>
                      저장하기
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setIsEditing(true);
                    }}
                  >
                    <Edit3 />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                {visibleFields.map((step) => {
                  return (
                    <InfoItem
                      key={step.field.name}
                      label={step.title}
                      value={
                        <FormField
                          field={step.field}
                          formData={formData}
                          errors={errors}
                          handleChange={handleChange}
                          disabled={!isEditing}
                        />
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-10" />
        </div>

        {/* 하단 고정 버튼 영역 */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-between bg-transparent p-4">
          <Button
            className="cursor-pointer rounded-xl bg-red-600 opacity-50 hover:opacity-100"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            개체 삭제
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-full bg-white/80 backdrop-blur-sm dark:bg-gray-600/50 dark:text-white dark:hover:bg-gray-800/80"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(false);
            }}
          >
            <FlipHorizontal className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center gap-4 py-1">
    <dt className="min-w-[80px] shrink-0 text-[16px] text-gray-500">{label}</dt>
    <dd className="flex-1">{value}</dd>
  </div>
);

export default CardBack;
