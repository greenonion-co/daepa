"use client";

import {
  parentRequestControllerLinkParent,
  parentRequestControllerUnlinkParent,
  petControllerGetParentsByPetId,
  brPetControllerFindAll,
  PetDtoSpecies,
  UnlinkParentDtoRole,
  GetParentsByPetIdResponseDtoData,
} from "@repo/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "@/lib/toast";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { Info } from "lucide-react";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import { PetParentDtoWithMessage } from "../../store/parentLink";
import ParentLink from "../../components/ParentLink";

interface PedigreeInfoContentProps {
  species: PetDtoSpecies;
  petId: string;
  userId?: string;
  initialParents: GetParentsByPetIdResponseDtoData | null;
}

const PedigreeInfoContent = ({
  species,
  petId,
  userId,
  initialParents,
}: PedigreeInfoContentProps) => {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  const isMyPet = useIsMyPet(userId);
  const [loadingRole, setLoadingRole] = useState<UnlinkParentDtoRole | null>(null);

  const { data: queryParents, refetch } = useQuery({
    queryKey: [petControllerGetParentsByPetId.name, petId],
    queryFn: () => petControllerGetParentsByPetId(petId),
    select: (response) => response.data.data,
    enabled: !initialParents,
  });

  // 서버에서 받은 초기 데이터 또는 React Query 데이터 사용
  const parents = queryParents ?? initialParents;

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
      setLoadingRole(role);
      try {
        await mutateRequestParent({
          parentId: value.petId,
          role,
          message: value.message ?? "",
        });
        await refetch();

        // 펫 목록 쿼리를 stale 처리 (백그라운드 갱신, await 하지 않아 저장 동작 차단 없음)
        queryClient.invalidateQueries({ queryKey: [brPetControllerFindAll.name] });

        toast.success(
          value.isMyPet ? "부모 등록이 완료되었습니다." : "부모 요청이 전송되었습니다.",
        );
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message ?? "부모 연동 요청에 실패했습니다.");
        } else {
          toast.error("부모 연동 요청에 실패했습니다.");
        }
      } finally {
        setLoadingRole(null);
      }
    },
    [mutateRequestParent, refetch, queryClient],
  );

  const handleUnlink = useCallback(
    async (label: UnlinkParentDtoRole) => {
      const parent = parents?.[label];
      if (!parent || !("petId" in parent) || !parent.petId)
        return toast.error("부모 연동 해제에 실패했습니다.");
      setLoadingRole(label);
      try {
        await mutateUnlinkParent({ role: label });
        await refetch();

        // 펫 목록 쿼리를 stale 처리 (백그라운드 갱신, await 하지 않아 저장 동작 차단 없음)
        queryClient.invalidateQueries({ queryKey: [brPetControllerFindAll.name] });

        toast.success("부모 연동이 해제되었습니다.");
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message ?? "부모 연동 해제에 실패했습니다.");
        } else {
          toast.error("부모 연동 해제에 실패했습니다.");
        }
      } finally {
        setLoadingRole(null);
      }
    },
    [parents, mutateUnlinkParent, refetch, queryClient],
  );

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 shadow-xs dark:bg-neutral-900">
      <div className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">혈통 정보</div>

      <div className="flex items-center gap-1 text-[12px] text-gray-500 dark:text-gray-400">
        <Info className="h-4 w-4" />
        이미지 혹은 이름을 클릭하면 상세 페이지로 이동합니다.
      </div>

      <div className="flex gap-3 max-[300px]:flex-col">
        <ParentLink
          excludePetId={petId}
          species={species}
          label="부"
          data={parents?.father}
          isLoading={loadingRole === UnlinkParentDtoRole.FATHER}
          onSelect={(selectedPet) =>
            handleParentSelect(UnlinkParentDtoRole.FATHER, {
              ...selectedPet,
              isMyPet: selectedPet.owner.userId === user?.userId,
            })
          }
          onUnlink={() => handleUnlink(UnlinkParentDtoRole.FATHER)}
          editable={isMyPet}
        />
        <ParentLink
          excludePetId={petId}
          species={species}
          label="모"
          data={parents?.mother}
          isLoading={loadingRole === UnlinkParentDtoRole.MOTHER}
          onSelect={(selectedPet) =>
            handleParentSelect(UnlinkParentDtoRole.MOTHER, {
              ...selectedPet,
              isMyPet: selectedPet.owner.userId === user?.userId,
            })
          }
          onUnlink={() => handleUnlink(UnlinkParentDtoRole.MOTHER)}
          editable={isMyPet}
        />
      </div>
    </div>
  );
};

export default PedigreeInfoContent;
