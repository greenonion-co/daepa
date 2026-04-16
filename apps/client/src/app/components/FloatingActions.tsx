"use client";

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
  // 비로그인 네이티브: 탭바가 숨겨지므로 하단에 가깝게 배치
  const isNativeGuest = isNativeApp() && !isLoggedIn;

  return (
    <div
      className={cn(
        "fixed right-4 z-50 flex flex-col-reverse items-center gap-2",
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
      )}
    >
      <AddPetButton />
      <QrScannerButton />
    </div>
  );
}
