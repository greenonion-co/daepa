"use client";

import Image from "next/image";
// import AppleLoginButton from "./AppleLoginButton";
import { providerIconMap } from "../constants";
import { useEffect } from "react";
import { tokenStorage } from "@/lib/tokenStorage";
import { UserProfileDtoProviderItem } from "@repo/api-client";

const SignInPage = () => {
  useEffect(() => {
    // sign-in 페이지에 도달했다면 refreshToken이 유효하지 않은 상태이므로
    // localStorage의 stale accessToken을 정리
    tokenStorage.removeToken();
  }, []);

  return (
    <div className="flex min-h-[calc(100dvh-52px)] w-full items-center justify-center dark:bg-black">
      <div className="w-[90vw] max-w-md">
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
