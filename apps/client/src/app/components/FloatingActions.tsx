"use client";

import { useSearchParams } from "next/navigation";
import { isNativeApp, isAndroid } from "@/lib/native-bridge";
import { cn } from "@/lib/utils";
import AddPetButton from "@/app/(브리더스룸)/components/AddPetButton";
import QrScannerButton from "@/app/components/QrScannerButton";

export default function FloatingActions() {
  const searchParams = useSearchParams();
  const hasNativeTopBar = isNativeApp() && searchParams.get("_nativeTopBar") === "1";

  return (
    <div
      className={cn(
        "fixed right-4 z-50 flex flex-col-reverse items-center gap-2",
        isNativeApp()
          ? hasNativeTopBar
            ? "bottom-6"
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
