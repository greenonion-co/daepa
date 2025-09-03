import { useMutation, useQueryClient } from "@tanstack/react-query";
import ParentLink from "../../../components/ParentLink";
import { PetParentDtoWithMessage } from "../../../store/parentLink";
import {
  petControllerFindPetByPetId,
  petControllerLinkParent,
  petControllerUnlinkParent,
  UnlinkParentDtoRole,
  UpdateParentRequestDtoStatus,
} from "@repo/api-client";
import { toast } from "sonner";
import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import { memo, useCallback } from "react";
import { AxiosError } from "axios";

interface PedigreeSectionProps {
  petId: string;
  isMyPet: boolean;
}

const PedigreeSection = memo(({ petId, isMyPet }: PedigreeSectionProps) => {
  const queryClient = useQueryClient();
  const { formData } = usePetStore();

  const { mutate: mutateUnlinkParent } = useMutation({
    mutationFn: ({ role }: { role: UnlinkParentDtoRole }) =>
      petControllerUnlinkParent(petId, { role }),
    onSuccess: () => {
      toast.success("부모 연동 해제가 완료되었습니다.");
      queryClient.invalidateQueries({ queryKey: [petControllerFindPetByPetId.name, petId] });
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message);
      } else {
        toast.error("부모 연동 해제에 실패했습니다.");
      }
    },
  });

  const { mutate: mutateRequestParent } = useMutation({
    mutationFn: ({
      parentId,
      role,
      message,
    }: {
      parentId: string;
      role: UnlinkParentDtoRole;
      message: string;
    }) =>
      petControllerLinkParent(petId, {
        parentId,
        role,
        message,
      }),
    onSuccess: () => {
      toast.success("부모 연동 요청이 완료되었습니다.");
      queryClient.invalidateQueries({ queryKey: [petControllerFindPetByPetId.name, petId] });
    },
    onError: () => {
      toast.error("부모 연동 요청에 실패했습니다.");
    },
  });

  const handleParentSelect = useCallback(
    (role: UnlinkParentDtoRole, value: PetParentDtoWithMessage) => {
      try {
        // 부모 연동 요청
        mutateRequestParent({
          parentId: value.petId,
          role,
          message: value.message ?? "",
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    },
    [mutateRequestParent],
  );

  const handleUnlink = useCallback(
    (label: UnlinkParentDtoRole) => {
      if (!formData[label]?.petId) return toast.error("부모 연동 해제에 실패했습니다.");
      mutateUnlinkParent({ role: label });
    },
    [formData, mutateUnlinkParent],
  );

  return (
    <div className="pb-4 pt-4">
      <h2 className="mb-3 text-xl font-bold">혈통 정보</h2>

      <div className="grid grid-cols-2 gap-4">
        <ParentLink
          species={formData.species}
          label="부"
          data={
            isMyPet ||
            (!isMyPet && formData.father?.status === UpdateParentRequestDtoStatus.APPROVED)
              ? formData.father
              : null
          }
          onSelect={(item) => handleParentSelect(UnlinkParentDtoRole.FATHER, item)}
          onUnlink={() => handleUnlink(UnlinkParentDtoRole.FATHER)}
          editable={isMyPet}
        />
        <ParentLink
          species={formData.species}
          label="모"
          data={
            isMyPet ||
            (!isMyPet && formData.mother?.status === UpdateParentRequestDtoStatus.APPROVED)
              ? formData.mother
              : null
          }
          onSelect={(item) => handleParentSelect(UnlinkParentDtoRole.MOTHER, item)}
          onUnlink={() => handleUnlink(UnlinkParentDtoRole.MOTHER)}
          editable={isMyPet}
        />
      </div>
    </div>
  );
});

PedigreeSection.displayName = "PedigreeSection";

export default PedigreeSection;
