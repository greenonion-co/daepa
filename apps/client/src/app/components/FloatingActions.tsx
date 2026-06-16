"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { isNativeApp, isAndroid } from "@/lib/native-bridge";
import { useIsLoggedIn } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import AddPetButton from "@/app/(브리더스룸)/components/AddPetButton";
import QrScannerButton, { isIosChrome } from "@/app/components/QrScannerButton";

export default function FloatingActions() {
  const searchParams = useSearchParams();
  const isLoggedIn = useIsLoggedIn();
  const hasNativeTopBar = isNativeApp() && searchParams.get("_nativeTopBar") === "1";
  const isNativeGuest = isNativeApp() && !isLoggedIn;

  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // 아래로 스크롤하면 숨기고, 위로 스크롤하면 다시 표시 — 콘텐츠 가림 최소화
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > lastY + 8 && y > 80) {
          setHidden(true);
          setOpen(false);
        } else if (y < lastY - 8) {
          setHidden(false);
        }
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bottomClass = (() => {
    if (!isNativeApp()) return "bottom-[92px]";
    if (hasNativeTopBar) return "bottom-6";
    if (isNativeGuest) return isAndroid() ? "bottom-16" : "bottom-6";
    return isAndroid() ? "bottom-32" : "bottom-16";
  })();

  const itemClass = cn(
    "flex items-center gap-2 transition-all duration-200",
    open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
  );

  const labelClass =
    "rounded-lg bg-neutral-900/85 px-2.5 py-1 text-xs font-medium text-white shadow-sm dark:bg-neutral-700";

  return (
    <>
      {/* 바깥 탭으로 닫기 */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
      />

      <div
        className={cn(
          "fixed right-4 z-50 flex flex-col items-end gap-3 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          bottomClass,
          hidden && "pointer-events-none translate-y-24 opacity-0",
        )}
      >
        {/* 스피드다이얼 항목 — QR 스캔 */}
        {!isIosChrome() && (
          <div
            onClick={() => setOpen(false)}
            className={itemClass}
            style={{ transitionDelay: open ? "60ms" : "0ms" }}
          >
            <span className={labelClass}>QR 스캔</span>
            <QrScannerButton />
          </div>
        )}

        {/* 스피드다이얼 항목 — 개체 추가 */}
        <div onClick={() => setOpen(false)} className={itemClass}>
          <span className={labelClass}>개체 추가</span>
          <AddPetButton />
        </div>

        {/* 메인 FAB */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-amber-400 to-amber-600 text-white ring-1 ring-white/20 shadow-[0_6px_14px_-2px_rgba(180,120,10,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all active:scale-95 active:shadow-[0_3px_8px_-2px_rgba(180,120,10,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] dark:from-amber-400 dark:to-amber-600"
        >
          <Plus
            className={cn("h-7 w-7 transition-transform duration-300", open && "rotate-45")}
            strokeWidth={2.5}
          />
        </button>
      </div>
    </>
  );
}
