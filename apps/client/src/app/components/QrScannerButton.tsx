"use client";

import { ScanLine } from "lucide-react";
import { overlay } from "overlay-kit";
import { isNativeApp, requestOpenQrScanner } from "@/lib/native-bridge";
import { cn } from "@/lib/utils";
import QrScanner from "./QrScanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function openQrScanner() {
  if (isNativeApp()) {
    requestOpenQrScanner();
    return;
  }

  overlay.open(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR 스캔</DialogTitle>
        </DialogHeader>
        <QrScanner onClose={close} />
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
        "fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-800 text-white shadow-lg shadow-neutral-900/30 ring-1 ring-white/20 transition-all active:scale-95 dark:bg-neutral-700 dark:text-neutral-100 dark:shadow-neutral-900/40 dark:ring-white/20",
        isNativeApp() ? "bottom-24" : "bottom-[92px]",
      )}
    >
      <ScanLine className="h-6 w-6" strokeWidth={2} />
    </button>
  );
}
