import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useCallback } from "react";
import {
  brMatingControllerFindAll,
  layingControllerCreate,
  PetDtoSpecies,
} from "@repo/api-client";

/**
 * 산란 생성 훅 옵션
 */
export interface UseCreateLayingOptions {
  /** 성공 시 콜백 (선택) */
  onSuccess?: () => void;
  /** 실패 시 콜백 (선택) */
  onError?: (error: unknown) => void;
  /** 캐시 무효화 여부 (기본값: true) */
  shouldInvalidateCache?: boolean;
}

/**
 * 산란 생성 폼 데이터
 */
export interface CreateLayingFormData {
  matingId: number;
  layingDate: string;
  species: PetDtoSpecies;
  clutchCount: number;
  temperature?: number;
  clutch?: number;
  motherId?: string;
  fatherId?: string;
}

/**
 * 산란 생성 비즈니스 로직 훅
 *
 * @description
 * - Single Responsibility: 산란 생성 로직만 담당
 * - Dependency Inversion: 구체적인 구현 대신 콜백에 의존
 *
 * @example
 * ```tsx
 * const { createLaying, isPending } = useCreateLaying({
 *   onSuccess: () => console.log('완료'),
 * });
 *
 * await createLaying({
 *   matingId: 1,
 *   formData: {
 *     layingDate: '2024-01-01',
 *     species: PetDtoSpecies.CRESTED,
 *     clutchCount: 2,
 *     temperature: 25,
 *     clutch: 1,
 *   }
 * });
 * ```
 */
export function useCreateLaying(options: UseCreateLayingOptions = {}) {
  const { onSuccess, onError, shouldInvalidateCache = true } = options;

  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: layingControllerCreate,
  });

  /**
   * 산란 생성 실행
   */
  const createLaying = useCallback(
    async (formData: CreateLayingFormData) => {
      try {
        const { data } = await mutateAsync({
          matingId: formData.matingId,
          layingDate: formData.layingDate,
          species: formData.species,
          clutchCount: formData.clutchCount,
          temperature: formData.temperature,
          clutch: formData.clutch,
          motherId: formData.motherId,
          fatherId: formData.fatherId,
        });

        if (data?.success) {
          // 성공 토스트
          toast.success("산란이 추가되었습니다.");

          // 캐시 무효화 (옵션)
          if (shouldInvalidateCache) {
            queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
          }

          // 커스텀 성공 콜백
          if (onSuccess) {
            onSuccess();
          }
        }
      } catch (error) {
        // 에러 처리
        if (error instanceof AxiosError && error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("산란 추가에 실패했습니다.");
        }

        // 커스텀 에러 콜백
        if (onError) {
          onError(error);
        }

        throw error; // 상위에서 추가 처리 가능
      }
    },
    [mutateAsync, queryClient, shouldInvalidateCache, onSuccess, onError],
  );

  return {
    createLaying,
    isPending,
  };
}
