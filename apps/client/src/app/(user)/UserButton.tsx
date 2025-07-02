"use client";

import { authControllerSignOut } from "@repo/api-client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const UserButton = () => {
  const router = useRouter();
  // TODO: 매번 스토리지 조회 대신 유저 세션 관리 hook 적용하기
  const isLoggedIn = localStorage.getItem("accessToken");

  const { mutate: signOut } = useMutation({
    mutationFn: authControllerSignOut,
  });

  const handleClick = () => {
    if (isLoggedIn) {
      localStorage.removeItem("accessToken");
      signOut();

      // TODO: 직접 보내는 것 대신 사용자의 인증 여부를 판별하여 자동으로 튕겨내기
      router.push("/sign-in");
    }
  };

  return <button onClick={handleClick}>{isLoggedIn ? "로그아웃" : "로그인"}</button>;
};

export default UserButton;
