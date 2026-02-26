"use client";

import LoadingScreen from "@/app/loading";
import { tokenStorage } from "@/lib/tokenStorage";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import {
  UserDtoStatus,
  authControllerGetToken,
  AXIOS_INSTANCE,
} from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "@/lib/toast";

const AuthPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userStatus = searchParams.get("status");
  const authCode = searchParams.get("code");

  const onLoginSuccess = useUserStore((state) => state.onLoginSuccess);
  const isProcessed = useRef(false);

  const { data } = useQuery({
    queryKey: ["authGetToken", authCode],
    queryFn: () => {
      // auth code가 있으면 토큰 교환, 없으면 cookie 기반 refresh
      if (authCode) {
        return AXIOS_INSTANCE.get<{ token: string }>("/api/auth/token", {
          params: { code: authCode },
        });
      }
      return authControllerGetToken();
    },
    select: (response) => response.data,
  });

  useEffect(() => {
    if (!data?.token || !userStatus || isProcessed.current) return;
    isProcessed.current = true;

    const handleAuth = async () => {
      const redirectUrl = localStorage.getItem("redirectUrl");

      switch (userStatus) {
        case UserDtoStatus.PENDING: {
          // PENDING 상태는 토큰만 저장 (아직 회원가입 미완료)
          tokenStorage.setToken(data.token);
          const registerUrl = redirectUrl
            ? `/sign-in/register?redirectUrl=${encodeURIComponent(redirectUrl)}`
            : "/sign-in/register";
          router.replace(registerUrl);
          break;
        }
        case UserDtoStatus.ACTIVE:
          // 로그인 성공: 토큰 저장 + 사용자 정보 조회
          await onLoginSuccess(data.token);

          if (redirectUrl) {
            localStorage.removeItem("redirectUrl");
            router.replace(redirectUrl);
          } else {
            router.replace("/");
          }

          toast.success("로그인에 성공했습니다.");
          break;
        default:
          router.replace("/sign-in");
          toast.error("로그인에 실패했습니다.");
          break;
      }
    };

    void handleAuth();
  }, [data, userStatus, router, onLoginSuccess]);

  return <LoadingScreen />;
};

export default AuthPage;
