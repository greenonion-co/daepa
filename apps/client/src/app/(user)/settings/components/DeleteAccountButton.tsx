"use client";

import { authControllerDeleteAccount } from "@repo/api-client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const DeleteAccountButton = () => {
  const router = useRouter();

  const { mutateAsync: mutateDeleteAccount } = useMutation({
    mutationFn: authControllerDeleteAccount,
  });

  const handleDeleteAccount = async () => {
    // TODO: 탈퇴 주의사항 알림 '정말 탈퇴하시겠습니가? 어쩌고'
    // TODO: 탈퇴 전 본인 재확인 (닉네임 한번 더 입력하는 방식 같은?) => 백엔드 기능 추가 필요
    await mutateDeleteAccount();

    localStorage.removeItem("accessToken");

    toast.success("탈퇴 처리되었습니다.");
    router.replace("/");
  };

  return <button onClick={handleDeleteAccount}>회원탈퇴</button>;
};

export default DeleteAccountButton;
