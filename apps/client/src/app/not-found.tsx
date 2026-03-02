"use client";

import { CircleAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <CircleAlert className="my-4 opacity-40" width={60} height={60} />
        <h1 className="text-[16px] font-[500] text-gray-700 dark:text-gray-100">
          페이지를 찾을 수 없습니다.
        </h1>
      </div>
    </div>
  );
}
