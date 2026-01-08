"use client";

import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <Image src="/assets/lizard.png" alt="Error" width={150} height={150} />

        <div>
          <h1 className="text-[16px] font-[500] text-gray-700 dark:text-gray-100">
            존재하지 않는 펫입니다
          </h1>
        </div>
      </div>
    </div>
  );
}
