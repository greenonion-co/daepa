import { FormField } from "@/app/(브리더스룸)/components/Form/FormField";
import { FORM_STEPS, OPTION_STEPS } from "@/app/(브리더스룸)/constants";
import { useFormStore } from "@/app/(브리더스룸)/register/store/form";
import { FieldName } from "@/app/(브리더스룸)/register/types";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import { useState, useEffect } from "react";
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
import useParentLinkStore from "../../store/parentLink";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import InfoItem from "@/app/(브리더스룸)/components/Form/InfoItem";
import { cn, formatDateToYYYYMMDD } from "@/lib/utils";
interface CardBackProps {
  pet: PetSummaryDto;
}

const CardBack = ({ pet }: CardBackProps) => {
  const { formData, errors, setFormData, setPage } = useFormStore();
  const { selectedParent, setSelectedParent } = useParentLinkStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const router = useRouter();
  const { mutate: mutateDeletePet } = useMutation({
    mutationFn: (petId: string) => petControllerDelete(petId),
    onSuccess: () => {
      router.push("/pet");

      toast.success("펫이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("펫 삭제에 실패했습니다.");
    },
  });

  const { mutate: mutateDeleteParent } = useMutation({
    mutationFn: ({ relationId }: { relationId: number }) =>
      parentControllerDeleteParent(relationId),
  });

  const { mutate: mutateRequestParent } = useMutation({
    mutationFn: ({
      parentId,
      role,
      isMyPet,
      message,
    }: {
      parentId: string;
      role: "father" | "mother";
      isMyPet: boolean;
      message: string;
    }) =>
      parentControllerCreateParent(pet.petId, {
        parentId,
        role,
        isMyPet,
        message,
      }),
    onSuccess: () => {
      toast.success("부모 연동 요청이 완료되었습니다.");
      const role = selectedParent?.sex?.toString() === "M" ? "father" : "mother";
      // TODO: isMyPet인 경우에는 status를 '"approved"로 설정
      setFormData((prev) => ({ ...prev, [role]: { ...selectedParent, status: "pending" } }));
      setSelectedParent(null);
    },
    onError: () => {
      toast.error("부모 연동 요청에 실패했습니다.");
      setSelectedParent(null);
    },
  });

  useEffect(() => {
    setFormData(pet);
    setPage("detail");
  }, [pet, setFormData, setPage]);

  const visibleFields = [
    ...[...FORM_STEPS].reverse(),
    ...OPTION_STEPS.filter((step) =>
      ["traits", "foods", "birthdate", "weight", "name", "desc"].includes(step.field.name),
    ),
  ];

  const handleChange = (value: {
    type: FieldName;
    value: string | string[] | PetSummaryDto | null;
  }) => {
    if (!isEditing) return;
    setFormData((prev) => ({ ...prev, [value.type]: value.value }));
  };

  const handleSave = async () => {
    try {
      const {
        petId,
        birthdate,
        ownerId,
        owner,
        isDeleted,
        father,
        mother,
        weight,
        ...restFormData
      } = formData;

      if (!petId) return;

      const updateData = {
        ...restFormData,
        ...(birthdate && { birthdate: formatDateToYYYYMMDD(birthdate) }),
        ...(weight && { weight: Number(weight) }),
      };

      await petControllerUpdate(petId, updateData as UpdatePetDto);
      setIsEditing(false);
      toast.success("펫 정보 수정이 완료되었습니다.");
    } catch (error) {
      console.error("Failed to update pet:", error);
      toast.error("펫 정보 수정에 실패했습니다.");
    }
  };

  const handleParentSelect = (
    role: "father" | "mother",
    value: PetSummaryDto & { message: string },
  ) => {
    try {
      setSelectedParent({
        ...value,
        status: "pending",
      });

      // 부모 연동 요청
      mutateRequestParent({
        parentId: value.petId,
        role,
        isMyPet: value.owner.userId === pet.owner.userId,
        message: value.message,
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const deletePet = async () => {
    try {
      if (!pet.petId) return;

      mutateDeletePet(pet.petId);
    } catch (error) {
      console.error("Failed to delete pet:", error);
    }
  };

  const handleDelete = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          deletePet();
          close();
        }}
        onExit={unmount}
        title="개체 삭제 안내"
        description={`정말로 삭제하시겠습니까? \n 삭제 후 복구할 수 없습니다.`}
      />
    ));
  };

  const handleUnlink = (label: "father" | "mother") => {
    try {
      if (!formData[label]?.petId) return;
      mutateDeleteParent({ relationId: formData[label]?.relationId });

      toast.success("부모 연동 해제가 완료되었습니다.");
      setFormData((prev) => ({ ...prev, [label]: null }));
    } catch {
      toast.error("부모 연동 해제에 실패했습니다.");
    }
  };

  const onToggle = () => {
    setIsPublic(!isPublic);
  };

  return (
    <div className="relative h-full w-full">
      <div className="h-full">
        <div className="px-6 pb-20">
          <div className="flex items-center gap-2">
            <Switch
              id="visibility"
              className="data-[state=checked]:bg-blue-600"
              checked={isPublic}
              onCheckedChange={onToggle}
            />
            <Label htmlFor="visibility" className="text-muted-foreground text-sm">
              다른 브리더에게 공개
            </Label>
          </div>

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
                {!isEditing && (
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
                      className={step.field.type === "textarea" ? "" : "flex gap-4"}
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
        </div>

        {/* 하단 고정 버튼 영역 */}
        <div
          className={cn(
            "sticky bottom-0 left-0 flex p-4",
            isEditing ? "justify-end" : "justify-between",
          )}
        >
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
            <Button variant="destructive" size="sm" onClick={handleDelete} className="text-white">
              삭제하기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardBack;
