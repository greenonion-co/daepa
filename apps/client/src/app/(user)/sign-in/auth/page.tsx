"use client";

import LoadingScreen from "@/app/loading";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const AuthPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      localStorage.setItem("accessToken", token);
      router.replace("/pet");
    } else {
      router.replace("/sign-in");
      toast.error("로그인에 실패했습니다.");
    }
  }, [token, router]);

  return <LoadingScreen />;
};

export default AuthPage;
