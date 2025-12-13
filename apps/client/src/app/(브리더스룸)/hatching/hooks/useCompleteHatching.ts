import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useCallback } from "react";
import {
  brMatingControllerFindAll,
  CompleteHatchingDto,
  petControllerCompleteHatching,
} from "@repo/api-client";

/**
 * 해칭 완료 훅 옵션
 */
export interface UseCompleteHatchingOptions {
  /** 성공 시 콜백 (선택) */
  onSuccess?: () => void;
  /** 실패 시 콜백 (선택) */
  onError?: (error: unknown) => void;
  /** 캐시 무효화 여부 (기본값: true) */
  shouldInvalidateCache?: boolean;
}

/**
 * 자동 이름 생성 파라미터
 */
export interface AutoNameParams {
  clutch?: number;
  clutchOrder?: number;
  fatherName?: string;
  motherName?: string;
}

/**
 * 자동 이름 생성 유틸리티
 *
 * @description
 * 부모 이름과 클러치 정보로 자동 이름 생성
 * 형식: "부x모_클러치번호알파벳" (예: "대x미_2A")
 *
 * @example
 * ```ts
 * generateAutoName({
 *   fatherName: "대박이",
 *   motherName: "미미",
 *   clutch: 2,
 *   clutchOrder: 1
 * }); // "대x미_2A"
 * ```
 */
export function generateAutoName({
  clutch,
  clutchOrder,
  fatherName,
  motherName,
}: AutoNameParams): string | null {
  if (clutch === undefined || clutchOrder === undefined) {
    return null;
  }

  // 부모 이름의 첫글자 추출, 없으면 "?" 사용
  const fatherFirstChar = fatherName ? fatherName.charAt(0) : "?";
  const motherFirstChar = motherName ? motherName.charAt(0) : "?";

  // clutchOrder를 알파벳으로 변환 (1 -> A, 2 -> B, ...)
  const clutchOrderChar = String.fromCharCode(64 + clutchOrder);

  // 예: "대x미_2A" 형식으로 생성
  return `${fatherFirstChar}x${motherFirstChar}_${clutch}${clutchOrderChar}`;
}

/**
 * 해칭 완료 비즈니스 로직 훅
 *
 * @description
 * - Single Responsibility: 해칭 완료 로직만 담당
 * - Dependency Inversion: 구체적인 구현 대신 콜백에 의존
 *
 * @example
 * ```tsx
 * const { completeHatching, isPending } = useCompleteHatching({
 *   onSuccess: () => console.log('완료'),
 * });
 *
 * await completeHatching({
 *   petId: '123',
 *   formData: { hatchingDate: '2024-01-01', name: '이름' }
 * });
 * ```
 */
export function useCompleteHatching(options: UseCompleteHatchingOptions = {}) {
  const { onSuccess, onError, shouldInvalidateCache = true } = options;

  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ petId, formData }: { petId: string; formData: CompleteHatchingDto }) =>
      petControllerCompleteHatching(petId, formData),
  });

  /**
   * 해칭 완료 실행
   */
  const completeHatching = useCallback(
    async ({ petId, formData }: { petId: string; formData: CompleteHatchingDto }) => {
      try {
        const { data } = await mutateAsync({ petId, formData });

        if (data?.success) {
          // 성공 토스트
          toast.success("해칭 완료");

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
          toast.error("해칭에 실패했습니다.");
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
    completeHatching,
    isPending,
  };
}
