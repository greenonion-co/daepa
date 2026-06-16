"use client";

import { ScanLine } from "lucide-react";
import { overlay } from "overlay-kit";
import { isNativeApp, requestOpenQrScanner } from "@/lib/native-bridge";
import { toast } from "sonner";
import QrScanner from "./QrScanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** iOS Chrome(WKWebView)은 getUserMedia를 지원하지 않으므로 버튼 자체를 숨김 */
export function isIosChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  return /CriOS/i.test(navigator.userAgent);
}

async function openQrScanner() {
  if (isNativeApp()) {
    requestOpenQrScanner();
    return;
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
  } catch {
    toast.error("카메라를 사용할 수 없습니다. 카메라 권한을 확인해주세요.");
    return;
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
  if (isIosChrome()) return null;

  return (
    <button
      type="button"
      onClick={openQrScanner}
      className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-white shadow-lg ring-1 shadow-neutral-900/30 ring-white/20 transition-all active:scale-95 dark:bg-neutral-700 dark:text-neutral-100 dark:shadow-neutral-900/40 dark:ring-white/20"
    >
      <ScanLine className="h-6 w-6" strokeWidth={2} />
    </button>
  );
}
