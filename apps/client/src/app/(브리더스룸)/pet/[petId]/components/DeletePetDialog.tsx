"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { brPetControllerFindAll, petControllerDeletePet } from "@repo/api-client";

interface DeletePetDialogProps {
  petId: string;
  petName?: string;
}

export function DeletePetDialog({ petId, petName }: DeletePetDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const deletePetMutation = useMutation({
    mutationFn: async () => {
      return petControllerDeletePet(petId, { deleteReason });
    },
    onSuccess: () => {
      toast.success("펫이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: [brPetControllerFindAll.name] });
      router.push("/pet");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "펫 삭제 중 오류가 발생했습니다.";
      toast.error(message);
    },
  });

  const handleDelete = () => {
    deletePetMutation.mutate();
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
          <AlertDialogCancel disabled={deletePetMutation.isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deletePetMutation.isPending}
            className="bg-red-500 hover:bg-red-600"
          >
            {deletePetMutation.isPending ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
