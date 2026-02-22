import { QueryClient, InfiniteData } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { brPetControllerFindAll, PetDto } from "@repo/api-client";

/**
 * 펫 리스트 캐시에서 특정 펫의 필드를 패치합니다.
 */
export function patchPetListCache(
  queryClient: QueryClient,
  petId: string,
  patch: Partial<PetDto>,
) {
  queryClient.setQueriesData<
    InfiniteData<AxiosResponse<{ data: PetDto[]; meta: unknown }>>
  >({ queryKey: [brPetControllerFindAll.name] }, (oldData) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      pages: oldData.pages.map((page) => ({
        ...page,
        data: {
          ...page.data,
          data: page.data.data.map((p) =>
            p.petId === petId ? { ...p, ...patch } : p,
          ),
        },
      })),
    };
  });
}
