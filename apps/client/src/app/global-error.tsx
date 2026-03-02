"use client";

import { CircleAlert } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <div className="flex h-dvh flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <CircleAlert className="my-4 opacity-40" width={60} height={60} />
            <h1 className="text-[16px] font-[500] text-gray-700">문제가 발생했습니다.</h1>
          </div>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
