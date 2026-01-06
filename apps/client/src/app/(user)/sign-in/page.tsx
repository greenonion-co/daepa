"use client";

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
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-[#e5cf94] to-white dark:bg-black">
      <div className="w-[90vw] max-w-md">
        {/* 메인 카드 */}
        <div className="mb-5 text-center text-3xl font-bold text-gray-800/90 dark:text-white">
          브리더스룸 로그인
        </div>

        <div className="rounded-3xl bg-gradient-to-b from-white to-gray-50 p-5 dark:border dark:border-gray-700 dark:bg-gray-800/80">
          <div className="flex h-full w-full items-center justify-center py-5">
            <Image src="/assets/lizard.png" alt="브리더스룸 로그인 로고" width={200} height={200} />
          </div>

          <div>
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
              <span className="font-semibold dark:text-black">구글로 시작하기</span>
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
              <span className="font-semibold dark:text-black">카카오로 시작하기</span>
            </a>
          </div>
        </div>

        {/* 추가 안내 */}
        <div className="mt-6 text-center text-sm font-[500] text-gray-500 dark:text-gray-400">
          문제가 있으시면 고객센터로 문의해주세요
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
