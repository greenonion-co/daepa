import { useMutation, useQueryClient } from "@tanstack/react-query";
import ParentLink from "../../../components/ParentLink";
import { PetParentDtoWithMessage } from "../../../store/parentLink";
import {
  petControllerFindPetByPetId,
  parentRequestControllerLinkParent,
  parentRequestControllerUnlinkParent,
  UnlinkParentDtoRole,
  UpdateParentRequestDtoStatus,
} from "@repo/api-client";
import { toast } from "sonner";
import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import { memo, useCallback } from "react";
import { AxiosError } from "axios";

interface ParentsSectionProps {
  petId: string;
  isMyPet: boolean;
}

const ParentsSection = memo(({ petId, isMyPet }: ParentsSectionProps) => {
  const queryClient = useQueryClient();
  const { formData } = usePetStore();

  const { mutateAsync: mutateUnlinkParent } = useMutation({
    mutationFn: ({ role }: { role: UnlinkParentDtoRole }) =>
      parentRequestControllerUnlinkParent(petId, { role }),
  });

  const { mutateAsync: mutateRequestParent } = useMutation({
    mutationFn: ({
      parentId,
      role,
      message,
    }: {
      parentId: string;
      role: UnlinkParentDtoRole;
      message: string;
    }) =>
      parentRequestControllerLinkParent(petId, {
        parentId,
        role,
        message,
      }),
  });

  const handleParentSelect = useCallback(
    async (role: UnlinkParentDtoRole, value: PetParentDtoWithMessage) => {
      try {
        await mutateRequestParent({
          parentId: value.petId,
          role,
          message: value.message ?? "",
        });
        toast.success("부모 연동 요청이 완료되었습니다.");
        queryClient.invalidateQueries({ queryKey: [petControllerFindPetByPetId.name, petId] });
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message ?? "부모 연동 요청에 실패했습니다.");
        } else {
          toast.error("부모 연동 요청에 실패했습니다.");
        }
      }
    },
    [mutateRequestParent, queryClient, petId],
  );

  const handleUnlink = useCallback(
    async (label: UnlinkParentDtoRole) => {
      if (!formData[label]?.petId) return toast.error("부모 연동 해제에 실패했습니다.");
      try {
        await mutateUnlinkParent({ role: label });
        toast.success("부모 연동 해제가 완료되었습니다.");
        queryClient.invalidateQueries({ queryKey: [petControllerFindPetByPetId.name, petId] });
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message ?? "부모 연동 해제에 실패했습니다.");
        } else {
          toast.error("부모 연동 해제에 실패했습니다.");
        }
      }
    },
    [formData, mutateUnlinkParent, queryClient, petId],
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

ParentsSection.displayName = "ParentsSection";

export default ParentsSection;
