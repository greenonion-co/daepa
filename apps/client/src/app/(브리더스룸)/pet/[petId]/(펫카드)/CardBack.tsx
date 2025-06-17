import { FormField } from "@/app/(브리더스룸)/components/Form/FormField";
import { FORM_STEPS, OPTION_STEPS } from "@/app/(브리더스룸)/constants";
import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import { FieldName } from "@/app/(브리더스룸)/register/types";
import { Button } from "@/components/ui/button";
import { Edit3, InfoIcon } from "lucide-react";
import { useState, useEffect } from "react";
import ParentLink from "../../components/ParentLink";
import {
  petControllerUpdate,
  PetSummaryDto,
  UpdatePetDto,
  petControllerDelete,
  parentControllerDeleteParent,
  parentControllerCreateParent,
  PetDto,
  ParentDtoRole,
  PetDtoSex,
  ParentDtoStatus,
} from "@repo/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import Dialog from "@/app/(브리더스룸)/components/Form/Dialog";
import { useMutation } from "@tanstack/react-query";
import useParentLinkStore, { PetParentDtoWithMessage } from "../../store/parentLink";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import InfoItem from "@/app/(브리더스룸)/components/Form/InfoItem";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
interface CardBackProps {
  pet: PetDto;
  from: string | null;
}

const CardBack = ({ pet, from }: CardBackProps) => {
  const { formData, errors, setFormData, setPage } = usePetStore();
  const { selectedParent, setSelectedParent } = useParentLinkStore();

  const [isEditing, setIsEditing] = useState(from === "egg");
  const [isPublic, setIsPublic] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

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
      message,
    }: {
      parentId: string;
      role: ParentDtoRole;
      message: string;
    }) =>
      parentControllerCreateParent(pet.petId, {
        parentId,
        role,
        message,
      }),
    onSuccess: () => {
      toast.success("부모 연동 요청이 완료되었습니다.");
      const role =
        selectedParent?.sex?.toString() === PetDtoSex.MALE
          ? ParentDtoRole.FATHER
          : ParentDtoRole.MOTHER;
      setFormData((prev) => ({
        ...prev,
        [role]: { ...selectedParent, status: ParentDtoStatus.PENDING },
      }));
      setSelectedParent(null);
    },
    onError: () => {
      toast.error("부모 연동 요청에 실패했습니다.");
      setSelectedParent(null);
    },
  });

  useEffect(() => {
    if (from !== "egg") return;

    if (formData.name && formData.morphs && formData.birthdate) {
      setIsTooltipOpen(false);
    } else {
      setIsTooltipOpen(true);
    }
  }, [formData, from]);

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
      const { name, species, morphs, traits, growth, sex, foods, desc, birthdate, weight } =
        formData;

      if (!pet.petId) return;

      const updateData = {
        ...(name && { name }),
        ...(species && { species }),
        ...(morphs && { morphs }),
        ...(traits && { traits }),
        ...(growth && { growth }),
        ...(sex && { sex }),
        ...(foods && { foods }),
        ...(desc && { desc }),
        ...(birthdate && { birthdate: format(birthdate, "yyyyMMdd") }),
        ...(weight && { weight: Number(weight) }),
      };

      await petControllerUpdate(pet.petId, updateData as UpdatePetDto);
      setIsEditing(false);
      toast.success("펫 정보 수정이 완료되었습니다.");
    } catch (error) {
      console.error("Failed to update pet:", error);
      toast.error("펫 정보 수정에 실패했습니다.");
    }
  };

  const handleParentSelect = (role: ParentDtoRole, value: PetParentDtoWithMessage) => {
    try {
      setSelectedParent({
        ...value,
        status: ParentDtoStatus.PENDING,
      });

      // 부모 연동 요청
      mutateRequestParent({
        parentId: value.petId,
        role,
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

  const handleUnlink = (label: ParentDtoRole) => {
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
                currentPetOwnerId={pet.owner.userId}
                onSelect={(item) => handleParentSelect(ParentDtoRole.FATHER, item)}
                onUnlink={() => handleUnlink(ParentDtoRole.FATHER)}
              />
              <ParentLink
                label="모"
                data={formData.mother}
                currentPetOwnerId={pet.owner.userId}
                onSelect={(item) => handleParentSelect(ParentDtoRole.MOTHER, item)}
                onUnlink={() => handleUnlink(ParentDtoRole.MOTHER)}
              />
            </div>
          </div>

          {/* 사육 정보 */}
          <div>
            <div className="mb-2 flex items-center gap-1">
              <h2 className="text-xl font-bold">사육 정보</h2>
              {isTooltipOpen && (
                <Tooltip open>
                  <TooltipTrigger>
                    <InfoIcon className="mr-1 h-4 w-4 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>
                      <span className="font-bold">모프, 이름, 생년월일 </span>은 알에서 부화한
                      개체의 필수 정보입니다.
                      <br />
                      수정 후 저장하여 해칭을 완료해주세요.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
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
            <div className="flex flex-1 justify-between">
              <Button variant="destructive" size="sm" onClick={handleDelete} className="text-white">
                삭제하기
              </Button>

              {/* 수정 버튼 */}
              <div className="flex justify-end dark:bg-[#18181B]">
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setIsEditing(true);
                    }}
                  >
                    <Edit3 />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardBack;
