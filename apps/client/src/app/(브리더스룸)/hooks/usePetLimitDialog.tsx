"use client";

import { useState, useCallback } from "react";
import { AxiosError } from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * 서버가 공개 펫 슬롯 한도 초과 시 반환하는 에러 페이로드.
 * 백엔드: PetService.assertCanPublishPet (apps/server/src/pet/pet.service.ts)
 */
type PetLimitErrorBody = {
  code: "PET_PUBLIC_SLOT_EXCEEDED";
  message: string;
  limit: number;
  current: number;
  requested?: number;
};

const isPetLimitError = (error: unknown): PetLimitErrorBody | null => {
  if (!(error instanceof AxiosError)) return null;
  const body = error.response?.data as PetLimitErrorBody | undefined;
  if (body?.code !== "PET_PUBLIC_SLOT_EXCEEDED") return null;
  return body;
};

/**
 * 펫 공개 슬롯 한도 에러를 감지하고 다이얼로그로 안내하는 hook.
 *
 * 사용 패턴:
 * ```tsx
 * const { handlePetLimitError, petLimitDialog } = usePetLimitDialog();
 *
 * try {
 *   await mutateUpdatePet({ isPublic: true });
 * } catch (error) {
 *   if (handlePetLimitError(error)) return; // 다이얼로그로 처리됨
 *   // 그 외 일반 에러 처리
 * }
 *
 * return <>...{petLimitDialog}</>;
 * ```
 */
export const usePetLimitDialog = () => {
  const [info, setInfo] = useState<PetLimitErrorBody | null>(null);

  /**
   * AxiosError가 PET_PUBLIC_SLOT_EXCEEDED 면 다이얼로그를 띄우고 true 반환.
   * 그 외에는 false → 호출자가 일반 에러 처리(toast 등) 진행.
   */
  const handlePetLimitError = useCallback((error: unknown): boolean => {
    const body = isPetLimitError(error);
    if (!body) return false;
    setInfo(body);
    return true;
  }, []);

  const close = useCallback(() => setInfo(null), []);

  const petLimitDialog = (
    <AlertDialog open={!!info} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>공개 가능한 개체 수가 다 찼습니다</AlertDialogTitle>
          <AlertDialogDescription>
            {info && (
              <>
                현재 공개 중인 개체가 <strong>{info.current}개</strong>로
                한도(<strong>{info.limit}개</strong>)에 도달했습니다.
                <br />
                다른 개체를 비공개로 전환한 뒤 다시 시도해주세요.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={close}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { handlePetLimitError, petLimitDialog };
};
