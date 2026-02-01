"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authControllerAppleNative, UserDtoStatus } from "@repo/api-client";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { tokenStorage } from "@/lib/tokenStorage";
import { toast } from "@/lib/toast";

interface AppleSignInResponse {
  authorization: {
    code: string;
    id_token: string;
    state?: string;
  };
  user?: {
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

const AppleLoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const onLoginSuccess = useUserStore((state) => state.onLoginSuccess);

  const { mutateAsync: appleNativeLogin } = useMutation({
    mutationFn: authControllerAppleNative,
  });

  const handleAppleLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);

    const REDIRECT_URI = `${window.location.origin ?? ""}/sign-in/auth`;

    try {
      const AppleID = (window as any).AppleID;
      if (!AppleID?.auth) {
        toast.error("Apple 로그인을 사용할 수 없습니다.");
        setIsLoading(false);
        return;
      }

      await AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? "",
        scope: "email",
        redirectURI: REDIRECT_URI,
        usePopup: true,
      });

      const response: AppleSignInResponse = await AppleID.auth.signIn();

      const identityToken = response.authorization?.id_token;
      const authorizationCode = response.authorization?.code;
      const email = response.user?.email;

      if (!identityToken) {
        toast.error("Apple 로그인에 실패했습니다. 다시 시도해주세요.");
        setIsLoading(false);
        return;
      }

      const appleRes = await appleNativeLogin({
        identityToken,
        authorizationCode: authorizationCode ?? undefined,
        email: email ?? undefined,
      });

      const { status, accessToken } = appleRes.data;
      const redirectUrl = localStorage.getItem("redirectUrl");

      switch (status) {
        case UserDtoStatus.PENDING: {
          tokenStorage.setToken(accessToken);
          const registerUrl = redirectUrl
            ? `/sign-in/register?redirectUrl=${encodeURIComponent(redirectUrl)}`
            : "/sign-in/register";
          router.replace(registerUrl);
          break;
        }
        case UserDtoStatus.ACTIVE:
          await onLoginSuccess(accessToken);
          if (redirectUrl) {
            localStorage.removeItem("redirectUrl");
            router.replace(redirectUrl);
          } else {
            router.replace("/pet");
          }
          toast.success("로그인에 성공했습니다.");
          break;
        default:
          toast.error("로그인에 실패했습니다.");
          router.replace("/sign-in");
          break;
      }
    } catch (error) {
      const appleError = error as { error?: string };
      if (appleError?.error !== "popup_closed_by_user") {
        console.error("Apple login error:", error);
        toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="mb-2 flex h-[46px] w-full cursor-pointer items-center justify-center gap-3 rounded-[12px] bg-black disabled:cursor-not-allowed disabled:opacity-50"
      onClick={handleAppleLogin}
      disabled={isLoading}
    >
      <span className="font-semibold text-white">
        {isLoading ? "로그인 중..." : "Apple로 시작하기"}
      </span>
    </button>
  );
};

export default AppleLoginButton;
