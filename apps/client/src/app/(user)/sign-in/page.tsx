"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import AppleLoginButton from "./AppleLoginButton";
import { providerIconMap } from "../constants";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenStorage } from "@/lib/tokenStorage";
import { toast } from "sonner";
import { UserProfileDtoProviderItem } from "@repo/api-client";

const SignInPage = () => {
  const router = useRouter();

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token) {
      toast.error("이미 로그인된 사용자입니다.");
      router.replace("/pet");
    }
  }, [router]);

  return (
    <div className="m-2 flex min-h-screen w-full items-center justify-center bg-[#FAFAFA]">
      <div className="w-full max-w-md">
        {/* 메인 카드 */}
        <Card className="border-1 border-gray-100 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader className="pb-10 text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              브리더스 룸
            </CardTitle>
            <CardDescription className="text-gray-900 dark:text-gray-100">
              반려동물 브리더를 위한 전문 플랫폼입니다.
            </CardDescription>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              서비스를 이용하기 위해 로그인해주세요.
            </div>
          </CardHeader>

          <CardContent>
            <AppleLoginButton />
            <a
              className="mb-2 flex h-[46px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#F2F2F2]"
              href={`${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/auth/sign-in/${UserProfileDtoProviderItem.google}`}
            >
              <Image
                src={providerIconMap[UserProfileDtoProviderItem.google]}
                alt="Google"
                width={36}
                height={36}
              />
              <span className="font-semibold">구글로 시작하기</span>
            </a>

            <a
              className="flex h-[46px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#FEE500]"
              href={`${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/auth/sign-in/${UserProfileDtoProviderItem.kakao}`}
            >
              <Image
                src={providerIconMap[UserProfileDtoProviderItem.kakao]}
                alt="Kakao"
                width={18}
                height={18}
              />
              <span className="font-semibold">카카오로 시작하기</span>
            </a>
          </CardContent>
        </Card>

        {/* 추가 안내 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            문제가 있으시면 고객센터로 문의해주세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
