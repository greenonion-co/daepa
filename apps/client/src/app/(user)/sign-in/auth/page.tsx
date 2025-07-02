"use client";

import LoadingScreen from "@/app/loading";
import { authControllerGetToken, UserDtoStatus } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const AuthPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userStatus = searchParams.get("status");

  const { data } = useQuery({
    queryKey: [authControllerGetToken.name],
    queryFn: () => authControllerGetToken(),
    select: (response) => response.data,
  });

  useEffect(() => {
    if (!data?.token || !userStatus) return;

    localStorage.setItem("accessToken", data.token);

    switch (userStatus) {
      case UserDtoStatus.PENDING:
        router.replace("/sign-in/register");
        break;
      case UserDtoStatus.ACTIVE:
        // TODO: 사용자를 기존 페이지로 이동
        router.replace("/pet");
        break;
      default:
        router.replace("/sign-in");
        toast.error("로그인에 실패했습니다.");
        break;
    }
  }, [data, userStatus, router]);

  return <LoadingScreen />;
};

export default AuthPage;
