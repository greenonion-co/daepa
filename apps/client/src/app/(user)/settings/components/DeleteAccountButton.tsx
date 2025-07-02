"use client";

import { useState } from "react";
import { authControllerDeleteAccount } from "@repo/api-client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const DeleteAccountButton = () => {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { mutateAsync: mutateDeleteAccount, isPending } = useMutation({
    mutationFn: authControllerDeleteAccount,
  });

  const handleDeleteAccount = async () => {
    if (confirmText !== "탈퇴") {
      toast.error("정확한 텍스트를 입력해주세요.");
      return;
    }

    try {
      await mutateDeleteAccount();
      localStorage.removeItem("accessToken");
      toast.success("탈퇴 처리되었습니다.");
      router.replace("/");
    } catch (error) {
      toast.error("탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
        >
          회원탈퇴
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-bold text-red-500">7일 이내 재가입 불가능합니다.</span>
            <br />
            이 작업은 되돌릴 수 없습니다. 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.
            <br />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-text">
            계속하려면 아래에 <strong>"탈퇴"</strong>를 입력해주세요.
          </Label>
          <Input
            id="confirm-text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="탈퇴"
            className="border-red-300 focus:border-red-500"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={confirmText !== "탈퇴" || isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "처리중..." : "탈퇴하기"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountButton;
