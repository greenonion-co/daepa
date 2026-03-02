"use client";

import Image from "next/image";
// import AppleLoginButton from "./AppleLoginButton";
import { providerIconMap } from "../constants";
import { useEffect } from "react";
import { useAppRouter } from "@/hooks/useAppRouter";
import { tokenStorage } from "@/lib/tokenStorage";
import { toast } from "@/lib/toast";
import { UserProfileDtoProviderItem } from "@repo/api-client";

const SignInPage = () => {
  const router = useAppRouter();

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token) {
      toast.error("이미 로그인된 사용자입니다.");
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="flex min-h-[calc(100dvh-52px)] w-full items-center justify-center dark:bg-black">
      <div className="w-[90vw] max-w-md">
        {/* 메인 카드 */}
        <div className="mb-10 text-center text-3xl font-bold text-gray-800/90 dark:text-white">
          로그인
        </div>

        <div className="rounded-3xl">
          <div>
            {/*<AppleLoginButton />*/}
            <a
              className="mb-2 flex h-[46px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#F2F2F2]"
              href={`${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/auth/sign-in/${UserProfileDtoProviderItem.google}`}
            >
              <span className="flex w-9 items-center justify-center">
                <Image
                  src={providerIconMap[UserProfileDtoProviderItem.google]}
                  alt="Google"
                  width={36}
                  height={36}
                />
              </span>
              <span className="w-[120px] text-left font-semibold dark:text-black">
                구글로 시작하기
              </span>
            </a>

            <a
              className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#FEE500]"
              href={`${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/auth/sign-in/${UserProfileDtoProviderItem.kakao}`}
            >
              <span className="flex w-9 items-center justify-center">
                <Image
                  src={providerIconMap[UserProfileDtoProviderItem.kakao]}
                  alt="Kakao"
                  width={18}
                  height={18}
                />
              </span>
              <span className="w-[120px] text-left font-semibold dark:text-black">
                카카오로 시작하기
              </span>
            </a>
          </div>
        </div>

        {/* 추가 안내 */}
        <div className="mt-6 text-center text-sm font-[500] text-gray-500 dark:text-gray-400">
          문제가 있으면 고객센터로 문의해주세요
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
