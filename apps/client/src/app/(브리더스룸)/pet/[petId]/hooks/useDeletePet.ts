import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { petControllerDeletePet, brPetControllerFindAll } from "@repo/api-client";

/**
 * 펫 삭제 훅의 옵션
 */
export interface UseDeletePetOptions {
  /** 삭제 성공 시 실행될 콜백 (선택) */
  onSuccess?: () => void;
  /** 삭제 실패 시 실행될 콜백 (선택) */
  onError?: (error: unknown) => void;
  /** 삭제 후 리다이렉트할 경로 (기본값: "/pet") */
  redirectTo?: string;
  /** 캐시 무효화 여부 (기본값: true) */
  shouldInvalidateCache?: boolean;
}

/**
 * 펫 삭제 비즈니스 로직을 담당하는 커스텀 훅
 *
 * @description
 * - Single Responsibility: 펫 삭제 로직만 담당
 * - Dependency Inversion: 구체적인 구현 대신 콜백에 의존
 *
 * @example
 * ```tsx
 * const { deletePet, isPending } = useDeletePet({
 *   onSuccess: () => console.log('삭제 완료'),
 *   redirectTo: '/pet-list',
 * });
 *
 * await deletePet({ petId: '123', reason: '사유' });
 * ```
 */
export function useDeletePet(options: UseDeletePetOptions = {}) {
  const { onSuccess, onError, redirectTo = "/pet", shouldInvalidateCache = true } = options;

  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({ petId, reason }: { petId: string; reason: string }) => {
      return petControllerDeletePet(petId, { deleteReason: reason });
    },
  });

  /**
   * 펫을 삭제하고 후속 처리를 수행합니다.
   */
  const deletePet = async ({ petId, reason }: { petId: string; reason: string }) => {
    try {
      await mutateAsync({ petId, reason });

      // 성공 토스트
      toast.success("펫이 삭제되었습니다.");

      // 캐시 무효화 (옵션)
      if (shouldInvalidateCache) {
        queryClient.invalidateQueries({ queryKey: [brPetControllerFindAll.name] });
      }

      // 커스텀 성공 콜백 실행
      if (onSuccess) {
        onSuccess();
      }

      // 리다이렉트
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (error) {
      // 에러 처리
      if (error instanceof AxiosError) {
        const message = error?.response?.data?.message || "펫 삭제 중 오류가 발생했습니다.";
        toast.error(message);
      } else {
        toast.error("펫 삭제 중 오류가 발생했습니다.");
      }

      // 커스텀 에러 콜백 실행
      if (onError) {
        onError(error);
      }

      throw error; // 상위에서 추가 처리 가능하도록
    }
  };

  return {
    deletePet,
    isPending,
  };
}
