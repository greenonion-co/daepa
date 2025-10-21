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
        toast.success(
          value.isMyPet ? "부모 등록이 완료되었습니다." : "부모 연동 요청이 완료되었습니다.",
        );
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
            // 내 펫인 경우는 모든 상태를, 내 펫이 아닌 경우는 부모요청이 승인된 상태에만 정보를 노출
            isMyPet ||
            (!isMyPet && formData.father?.status === UpdateParentRequestDtoStatus.APPROVED)
              ? formData.father
              : null
          }
          onSelect={(selectedPet) =>
            handleParentSelect(UnlinkParentDtoRole.FATHER, {
              ...selectedPet,
              isMyPet: isMyPet,
            })
          }
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
          onSelect={(selectedPet) =>
            handleParentSelect(UnlinkParentDtoRole.MOTHER, {
              ...selectedPet,
              isMyPet: isMyPet,
            })
          }
          onUnlink={() => handleUnlink(UnlinkParentDtoRole.MOTHER)}
          editable={isMyPet}
        />
      </div>
    </div>
  );
});

ParentsSection.displayName = "ParentsSection";

export default ParentsSection;
