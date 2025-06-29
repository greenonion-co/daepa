"use client";

import LoadingScreen from "@/app/loading";
import { UserDtoStatus } from "@repo/api-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const AuthPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userStatus = searchParams.get("status");

  useEffect(() => {
    if (userStatus) {
      // localStorage.setItem("accessToken", token);
      if (userStatus === UserDtoStatus.PENDING) {
        router.replace("/sign-in/register");
      }
      if (userStatus === UserDtoStatus.ACTIVE) {
        router.replace("/pet");
      }
    } else {
      router.replace("/sign-in");
      toast.error("로그인에 실패했습니다.");
    }
  }, [userStatus, router]);

  return <LoadingScreen />;
};

export default AuthPage;
