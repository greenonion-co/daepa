"use client";

import { useRef, useCallback, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { isNativeApp, sendToNative } from "@/lib/native-bridge";
import { useAppRouter } from "@/hooks/useAppRouter";
import { toast } from "sonner";

const SERVICE_DOMAINS = ["breedy.kr", "www.breedy.kr"];

function extractPathFromQrUrl(decodedText: string): string | null {
  try {
    const url = new URL(decodedText);
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev && !SERVICE_DOMAINS.includes(url.hostname)) {
      return null;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    if (decodedText.startsWith("/")) {
      return decodedText;
    }
    return null;
  }
}

interface QrScannerProps {
  onClose?: () => void;
}

export default function QrScanner({ onClose }: QrScannerProps) {
  const router = useAppRouter();
  const scanLockRef = useRef(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      if (scanLockRef.current) return;
      scanLockRef.current = true;

      const path = extractPathFromQrUrl(decodedText);
      if (path) {
        router.push(path);
        onClose?.();
      } else {
        toast.error("서비스에서 지원하지 않는 QR 코드입니다.");
        setTimeout(() => {
          scanLockRef.current = false;
        }, 2000);
      }
    },
    [router, onClose],
  );

  useEffect(() => {
    if (isNativeApp()) {
      sendToNative({ type: "OPEN_QR_SCANNER" });
      onClose?.();
      return;
    }

    const html5QrCode = new Html5Qrcode("qr-scanner");
    html5QrCodeRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        handleScanSuccess,
        () => {},
      )
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("QR 스캐너 시작 실패:", message);
        toast.error(`카메라를 사용할 수 없습니다. ${message}`);
      });

    return () => {
      html5QrCode.stop().catch(() => {});
      html5QrCodeRef.current = null;
    };
  }, [handleScanSuccess, onClose]);

  if (isNativeApp()) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div id="qr-scanner" className="w-full max-w-sm overflow-hidden rounded-lg" />
      <p className="text-muted-foreground text-sm">QR 코드를 카메라에 비춰주세요</p>
    </div>
  );
}
