"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDeletePet } from "../hooks/useDeletePet";

/**
 * 펫 삭제 다이얼로그 Props
 */
export interface DeletePetDialogProps {
  /** 삭제할 펫 ID */
  petId: string;
  /** 펫 이름 (선택) */
  petName?: string;
  /** 삭제 성공 시 콜백 (선택) */
  onDeleteSuccess?: () => void;
  /** 삭제 실패 시 콜백 (선택) */
  onDeleteError?: (error: unknown) => void;
  /** 리다이렉트 경로 (선택, 기본값: "/pet") */
  redirectTo?: string;
  /** 캐시 무효화 여부 (선택, 기본값: true) */
  shouldInvalidateCache?: boolean;
}

/**
 * 펫 삭제 확인 다이얼로그
 *
 * @description
 * - Single Responsibility: UI 렌더링만 담당
 * - Open/Closed: Props를 통한 확장 가능
 * - Dependency Inversion: 비즈니스 로직은 useDeletePet 훅에 위임
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <DeletePetDialog petId="123" petName="멍멍이" />
 *
 * // 커스터마이징
 * <DeletePetDialog
 *   petId="123"
 *   petName="멍멍이"
 *   onDeleteSuccess={() => console.log('삭제 완료')}
 *   redirectTo="/custom-path"
 * />
 * ```
 */
export function DeletePetDialog({
  petId,
  petName,
  onDeleteSuccess,
  onDeleteError,
  redirectTo,
  shouldInvalidateCache,
}: DeletePetDialogProps) {
  // UI 상태만 관리
  const [open, setOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  // 비즈니스 로직은 커스텀 훅에 위임
  const { deletePet, isPending } = useDeletePet({
    onSuccess: onDeleteSuccess,
    onError: onDeleteError,
    redirectTo,
    shouldInvalidateCache,
  });

  /**
   * 삭제 핸들러 (UI 이벤트 처리만)
   */
  const handleDelete = async () => {
    try {
      await deletePet({ petId, reason: deleteReason });
      setOpen(false); // 성공 시 다이얼로그 닫기
    } catch {
      // 에러는 useDeletePet에서 처리됨
      // 다이얼로그는 열린 상태 유지 (사용자가 재시도 가능)
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{petName} 을 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription className="text-red-500">
            분양 또는 산란 이력이 있는 경우 함께 삭제됩니다.
            <br />
            삭제된 펫은 직접 복구할 수 없습니다.
            <br />
            신중히 선택해주세요.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="deleteReason">삭제 사유 (선택)</Label>
          <Textarea
            id="deleteReason"
            placeholder="삭제 사유를 입력하세요"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-red-500 hover:bg-red-600"
          >
            {isPending ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
