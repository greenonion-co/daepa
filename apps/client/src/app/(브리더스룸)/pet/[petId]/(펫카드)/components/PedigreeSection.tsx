import { useMutation, useQueryClient } from "@tanstack/react-query";
import ParentLink from "../../../components/ParentLink";
import { PetParentDtoWithMessage } from "../../../store/parentLink";
import {
  parentControllerCreateParent,
  parentControllerDeleteParent,
  ParentDtoRole,
  ParentDtoStatus,
  petControllerFindOne,
} from "@repo/api-client";
import { toast } from "sonner";
import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import { memo, useCallback } from "react";

interface PedigreeSectionProps {
  petId: string;
  isMyPet: boolean;
}

const PedigreeSection = memo(({ petId, isMyPet }: PedigreeSectionProps) => {
  const queryClient = useQueryClient();
  const { formData, setFormData } = usePetStore();

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
      parentControllerCreateParent(petId, {
        parentId,
        role,
        message,
      }),
    onSuccess: () => {
      toast.success("부모 연동 요청이 완료되었습니다.");
      queryClient.invalidateQueries({ queryKey: [petControllerFindOne.name, petId] });
    },
    onError: () => {
      toast.error("부모 연동 요청에 실패했습니다.");
    },
  });

  const handleParentSelect = useCallback(
    (role: ParentDtoRole, value: PetParentDtoWithMessage) => {
      try {
        // 부모 연동 요청
        mutateRequestParent({
          parentId: value.petId,
          role,
          message: value.message,
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    },
    [mutateRequestParent],
  );

  const handleUnlink = useCallback(
    (label: ParentDtoRole) => {
      try {
        if (!formData[label]?.petId || !formData[label]?.relationId)
          return toast.error("부모 연동 해제에 실패했습니다.");
        mutateDeleteParent({ relationId: formData[label]?.relationId });

        toast.success("부모 연동 해제가 완료되었습니다.");
        setFormData((prev) => ({ ...prev, [label]: null }));
      } catch {
        toast.error("부모 연동 해제에 실패했습니다.");
      }
    },
    [formData, mutateDeleteParent, setFormData],
  );

  const handleFatherSelect = useCallback(
    (item: PetParentDtoWithMessage) => {
      handleParentSelect(ParentDtoRole.FATHER, item);
    },
    [handleParentSelect],
  );

  const handleMotherSelect = useCallback(
    (item: PetParentDtoWithMessage) => {
      handleParentSelect(ParentDtoRole.MOTHER, item);
    },
    [handleParentSelect],
  );

  const handleFatherUnlink = useCallback(() => {
    handleUnlink(ParentDtoRole.FATHER);
  }, [handleUnlink]);

  const handleMotherUnlink = useCallback(() => {
    handleUnlink(ParentDtoRole.MOTHER);
  }, [handleUnlink]);

  return (
    <div className="pb-4 pt-4">
      <h2 className="mb-3 text-xl font-bold">혈통 정보</h2>

      <div className="grid grid-cols-2 gap-4">
        <ParentLink
          label="부"
          data={
            isMyPet || (!isMyPet && formData.father?.status === ParentDtoStatus.APPROVED)
              ? formData.father
              : null
          }
          onSelect={handleFatherSelect}
          onUnlink={handleFatherUnlink}
          editable={isMyPet}
        />
        <ParentLink
          label="모"
          data={
            isMyPet || (!isMyPet && formData.mother?.status === ParentDtoStatus.APPROVED)
              ? formData.mother
              : null
          }
          onSelect={handleMotherSelect}
          onUnlink={handleMotherUnlink}
          editable={isMyPet}
        />
      </div>
    </div>
  );
});

PedigreeSection.displayName = "PedigreeSection";

export default PedigreeSection;
