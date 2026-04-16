"use client";

import { useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { isNativeApp, isAndroid } from "@/lib/native-bridge";
import { useIsLoggedIn } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import AddPetButton from "@/app/(브리더스룸)/components/AddPetButton";
import QrScannerButton from "@/app/components/QrScannerButton";

export default function FloatingActions() {
  const searchParams = useSearchParams();
  const isLoggedIn = useIsLoggedIn();
  const hasNativeTopBar = isNativeApp() && searchParams.get("_nativeTopBar") === "1";
  const isNativeGuest = isNativeApp() && !isLoggedIn;
  const [collapsed, setCollapsed] = useState(false);

  // 스와이프 감지 (버튼 영역)
  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
  }, []);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
      if (dx > 30 && !collapsed) setCollapsed(true);
    },
    [collapsed],
  );

  // 스와이프 감지 (복귀 영역 — 좌측 스와이프만)
  const edgeTouchStartX = useRef(0);
  const handleEdgeTouchStart = useCallback((e: React.TouchEvent) => {
    edgeTouchStartX.current = e.touches[0]?.clientX ?? 0;
  }, []);
  const handleEdgeTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = (e.changedTouches[0]?.clientX ?? 0) - edgeTouchStartX.current;
      if (dx < -20 && collapsed) setCollapsed(false);
    },
    [collapsed],
  );

  return (
    <div
      className={cn(
        "fixed z-50",
        isNativeApp()
          ? hasNativeTopBar
            ? "bottom-6"
            : isNativeGuest
              ? isAndroid()
                ? "bottom-16"
                : "bottom-6"
              : isAndroid()
                ? "bottom-32"
                : "bottom-16"
          : "bottom-[92px]",
        collapsed ? "right-0" : "right-4",
      )}
    >
      {/* 펼침 상태 */}
      <div
        className={cn(
          "flex flex-col-reverse items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          collapsed
            ? "pointer-events-none translate-x-24 opacity-0"
            : "translate-x-0 opacity-100",
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AddPetButton />
        <QrScannerButton />
      </div>

      {/* 접힌 상태 — 우측 가장자리 스와이프 영역 (넓은 터치 영역 + 얇은 시각 탭) */}
      <div
        className={cn(
          "absolute bottom-0 right-0 flex h-24 w-10 items-center justify-end transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          collapsed
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onTouchStart={handleEdgeTouchStart}
        onTouchEnd={handleEdgeTouchEnd}
      >
        <div className="h-12 w-3 rounded-l-lg bg-blue-400/40 shadow-md dark:bg-blue-300/30">
          <span className="flex h-full items-center justify-center">
            <span className="h-5 w-[2px] rounded-full bg-white/60" />
          </span>
        </div>
      </div>
    </div>
  );
}
