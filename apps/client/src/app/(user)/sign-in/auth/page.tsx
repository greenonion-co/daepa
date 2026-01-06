"use client";

import LoadingScreen from "@/app/loading";
import { tokenStorage } from "@/lib/tokenStorage";
import { UserDtoStatus, AXIOS_INSTANCE } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const AuthPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userStatus = searchParams.get("status");
  const urlToken = searchParams.get("token"); // URL에서 전달받은 refreshToken

  const { data } = useQuery({
    queryKey: ["authControllerGetToken", urlToken],
    queryFn: async () => {
      // URL 파라미터로 토큰이 있으면 쿼리 파라미터로 전달 (모바일 cross-site 쿠키 차단 대응)
      const url = urlToken
        ? `/api/auth/token?token=${encodeURIComponent(urlToken)}`
        : `/api/auth/token`;
      const response = await AXIOS_INSTANCE.get<{ token: string }>(url);
      return response.data;
    },
  });

  useEffect(() => {
    if (!data?.token || !userStatus) return;

    tokenStorage.setToken(data.token);

    const redirectUrl = localStorage.getItem("redirectUrl");

    switch (userStatus) {
      case UserDtoStatus.PENDING: {
        const registerUrl = redirectUrl
          ? `/sign-in/register?redirectUrl=${encodeURIComponent(redirectUrl)}`
          : "/sign-in/register";
        router.replace(registerUrl);
        break;
      }
      case UserDtoStatus.ACTIVE:
        if (redirectUrl) {
          localStorage.removeItem("redirectUrl");
          router.replace(redirectUrl);
        } else {
          router.replace("/pet");
        }

        toast.success("로그인에 성공했습니다.");
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
