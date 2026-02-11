"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { brPetControllerFindAll, petControllerDeletePet, PetDto } from "@repo/api-client";
import { AxiosResponse } from "axios";
import { useIsMobile } from "@/hooks/useMobile";

interface DeletePetButtonProps {
  petId: string;
  petName?: string;
  onSuccess?: () => void;
}

function DeletePetButton({ petId, petName, onSuccess }: DeletePetButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      return petControllerDeletePet(petId, { deleteReason });
    },
  });

  const handleDelete = async () => {
    try {
      await mutateAsync();
      setOpen(false);
      toast.success("펫이 삭제되었습니다.");

      // 펫 목록 캐시에서 해당 펫 제거 (전체 refetch 방지)
      queryClient.setQueriesData<
        InfiniteData<AxiosResponse<{ data: PetDto[]; meta: { totalCount: number } }>>
      >({ queryKey: [brPetControllerFindAll.name] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => ({
            ...page,
            data: {
              ...page.data,
              data: page.data.data.filter((p) => p.petId !== petId),
              meta:
                index === 0
                  ? { ...page.data.meta, totalCount: Math.max(0, page.data.meta.totalCount - 1) }
                  : page.data.meta,
            },
          })),
        };
      });

      if (isMobile) {
        router.push("/pet");
      } else {
        onSuccess?.();
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "펫 삭제 중 오류가 발생했습니다.";
      toast.error(message);
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

export default DeletePetButton;
