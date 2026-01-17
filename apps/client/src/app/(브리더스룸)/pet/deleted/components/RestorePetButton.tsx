"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { toast } from "@/lib/toast";

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
import {
  brPetControllerFindAll,
  petControllerGetDeletedPets,
  petControllerRestorePet,
  UserProfileDtoRole,
} from "@repo/api-client";
import { useUserStore } from "@/app/(브리더스룸)/store/user";

interface RestorePetButtonProps {
  petId: string;
  petName?: string;
}

export function RestorePetButton({ petId, petName }: RestorePetButtonProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  const restorePetMutation = useMutation({
    mutationFn: async () => {
      return petControllerRestorePet(petId);
    },
    onSuccess: () => {
      toast.success("펫이 복구되었습니다.");
      queryClient.invalidateQueries({ queryKey: [petControllerGetDeletedPets.name] });
      queryClient.invalidateQueries({ queryKey: [brPetControllerFindAll.name] });
      setOpen(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "펫 복구 중 오류가 발생했습니다.";
      toast.error(message);
    },
  });

  const handleRestore = () => {
    restorePetMutation.mutate();
  };

  // admin이 아니면 null 반환
  if (!user || user.role !== UserProfileDtoRole.ADMIN) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <RotateCcw className="h-3 w-3" />
          복구
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>펫을 복구하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            {petName ? `"${petName}"` : "이 펫"}을 복구하면 다시 펫 목록에 표시됩니다.
            <br />
            삭제 전 상태로 복구됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={restorePetMutation.isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleRestore();
            }}
            disabled={restorePetMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {restorePetMutation.isPending ? "복구 중..." : "복구"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
