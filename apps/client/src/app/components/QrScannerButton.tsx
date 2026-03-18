"use client";

import { ScanLine } from "lucide-react";
import { overlay } from "overlay-kit";
import { isNativeApp, requestOpenQrScanner } from "@/lib/native-bridge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import QrScanner from "./QrScanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

async function openQrScanner() {
  if (isNativeApp()) {
    requestOpenQrScanner();
    return;
  }

  // 유저 제스처 컨텍스트에서 카메라 stream 획득
  if (!navigator.mediaDevices?.getUserMedia) {
    toast.error("이 브라우저/환경에서는 카메라를 사용할 수 없습니다.");
    return;
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
  } catch {
    // iOS Chrome 등에서 facingMode constraint 실패 시 기본 카메라로 fallback
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
    } catch {
      toast.error("카메라를 사용할 수 없습니다. 카메라 권한을 확인해주세요.");
      return;
    }
  }

  overlay.open(({ isOpen, close }) => (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          stream.getTracks().forEach((t) => t.stop());
        }
        close();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR 스캔</DialogTitle>
        </DialogHeader>
        <QrScanner stream={stream} onClose={close} />
      </DialogContent>
    </Dialog>
  ));
}

export default function QrScannerButton() {
  return (
    <button
      type="button"
      onClick={openQrScanner}
      className={cn(
        "fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-white shadow-lg ring-1 shadow-neutral-900/30 ring-white/20 transition-all active:scale-95 dark:bg-neutral-700 dark:text-neutral-100 dark:shadow-neutral-900/40 dark:ring-white/20",
        isNativeApp() ? "bottom-24" : "bottom-[92px]",
      )}
    >
      <ScanLine className="h-6 w-6" strokeWidth={2} />
    </button>
  );
}
