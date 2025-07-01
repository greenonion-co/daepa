"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

const SignInPage = () => {
  return (
    <div className="m-2 flex min-h-screen w-full items-center justify-center">
      <div className="w-full max-w-md">
        {/* 메인 카드 */}
        <Card className="border-1 border-gray-100 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader className="pb-20 text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              브리더스 룸
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              반려동물 브리더를 위한 전문 플랫폼입니다.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <a
              className="mb-2 flex h-[46px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#F2F2F2]"
              href={"http://localhost:4000/api/auth/sign-in/google"}
            >
              <Image src="/google_icon.svg" alt="Google" width={36} height={36} />
              <span className="font-semibold">구글로 시작하기</span>
            </a>

            <a
              className="flex h-[46px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#FEE500]"
              href={"http://localhost:4000/api/auth/sign-in/kakao"}
            >
              <Image src="/kakao_icon.svg" alt="Kakao" width={18} height={18} />
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
