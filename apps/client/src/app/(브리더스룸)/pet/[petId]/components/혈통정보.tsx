import {
  parentRequestControllerLinkParent,
  parentRequestControllerUnlinkParent,
  petControllerFindPetByPetId,
  petControllerGetParentsByPetId,
  PetDtoSpecies,
  UnlinkParentDtoRole,
  UpdateParentRequestDtoStatus,
} from "@repo/api-client";
import ParentLink from "../../components/ParentLink";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { PetParentDtoWithMessage } from "../../store/parentLink";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { Info } from "lucide-react";

const PedigreeInfo = ({
  petId,
  userId,
  species,
}: {
  petId: string;
  userId?: string;
  species: PetDtoSpecies;
}) => {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  const isMyPet = userId === user?.userId;

  const { data: parents } = useQuery({
    queryKey: [petControllerGetParentsByPetId.name, petId],
    queryFn: () => petControllerGetParentsByPetId(petId),
    select: (response) => response.data.data,
  });

  console.log(parents?.father);

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
      const parent = parents?.[label];
      if (!parent || !("petId" in parent) || !parent.petId)
        return toast.error("부모 연동 해제에 실패했습니다.");
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
    [parents, mutateUnlinkParent, queryClient, petId],
  );

  return (
    <div className="shadow-xs flex h-fit w-full max-w-[650px] flex-col gap-2 rounded-2xl bg-white p-3">
      <div className="text-[14px] font-[600] text-gray-600">혈통정보</div>

      <div className="flex items-center gap-1 text-[12px] text-gray-500">
        <Info className="h-4 w-4" />
        이미지 혹은 이름을 클릭하면 상세 페이지로 이동합니다.
      </div>

      <div className="flex gap-3 max-[650px]:flex-col">
        <ParentLink
          label="부"
          data={
            // 내 펫인 경우는 모든 상태를, 내 펫이 아닌 경우는 부모요청이 승인된 상태에만 정보를 노출
            isMyPet ||
            (!isMyPet &&
              parents?.father &&
              "status" in parents.father &&
              parents.father?.status === UpdateParentRequestDtoStatus.APPROVED)
              ? parents?.father
              : undefined
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
          species={species}
          label="모"
          data={
            isMyPet ||
            (!isMyPet &&
              parents?.mother &&
              "status" in parents.mother &&
              parents.mother?.status === UpdateParentRequestDtoStatus.APPROVED)
              ? parents?.mother
              : undefined
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
};

export default PedigreeInfo;
