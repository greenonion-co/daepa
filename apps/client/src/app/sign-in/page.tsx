"use client";

import Image from "next/image";

const SignInPage = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <div className="flex h-full w-full max-w-[640px] flex-col bg-white p-8 pt-10 shadow-[0_0_15px_0_rgba(0,0,0,0.1)]">
        <div className="mb-50 space-y-2">
          <h1 className="text-[32px] font-bold text-gray-900">브리더스 룸</h1>
          <p className="text-[18px] text-gray-600">반려동물 브리더를 위한 전문 플랫폼입니다.</p>
        </div>

        <div>
          <button className="mb-2 flex h-[46px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#F2F2F2]">
            <Image src="/google_icon.svg" alt="Google" width={36} height={36} />
            <span className="text-[16px] font-semibold">구글로 시작하기</span>
          </button>

          <button className="flex h-[46px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#FEE500]">
            <Image src="/kakao_icon.svg" alt="Kakao" width={18} height={18} />
            <span className="text-[16px] font-semibold">카카오로 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
