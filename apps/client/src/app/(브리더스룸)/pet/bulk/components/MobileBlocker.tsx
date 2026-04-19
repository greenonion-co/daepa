"use client";

import { useEffect, useState } from "react";
import { Monitor } from "lucide-react";

/** 폭 900px 미만이면 데스크톱 안내 화면을 노출. Children은 그 외에만 렌더. */
export default function MobileBlocker({ children }: { children: React.ReactNode }) {
  const [tooNarrow, setTooNarrow] = useState(false);

  useEffect(() => {
    const update = () => setTooNarrow(window.innerWidth < 900);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (tooNarrow) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
        <Monitor className="mb-4 h-12 w-12 text-gray-400" />
        <h2 className="mb-2 text-lg font-semibold">데스크톱에서 이용해주세요</h2>
        <p className="max-w-sm text-sm text-gray-500">
          개체 대량 등록은 화면이 넓은 PC/데스크톱 환경에서 사용하실 수 있습니다.
          모바일은 단건 등록 또는 CSV 파일 업로드를 이용해주세요.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
