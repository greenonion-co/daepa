"use client";

import { useRef, useCallback, useEffect } from "react";
import jsQR from "jsqr";
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
  stream: MediaStream;
  onClose?: () => void;
}

export default function QrScanner({ stream, onClose }: QrScannerProps) {
  const router = useAppRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanLockRef = useRef(false);
  const animationRef = useRef<number>(0);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      if (scanLockRef.current) return;
      scanLockRef.current = true;

      const path = extractPathFromQrUrl(decodedText);
      if (path) {
        stream.getTracks().forEach((t) => t.stop());
        router.push(path);
        onClose?.();
      } else {
        toast.error("서비스에서 지원하지 않는 QR 코드입니다.");
        setTimeout(() => {
          scanLockRef.current = false;
        }, 2000);
      }
    },
    [router, onClose, stream],
  );

  useEffect(() => {
    if (isNativeApp()) {
      sendToNative({ type: "OPEN_QR_SCANNER" });
      onClose?.();
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    video.srcObject = stream;
    video.play().catch(() => {});

    let active = true;

    const scan = () => {
      if (!active) return;

      if (video.readyState >= video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code?.data) {
          handleScanSuccess(code.data);
        }
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    animationRef.current = requestAnimationFrame(scan);

    return () => {
      active = false;
      cancelAnimationFrame(animationRef.current);
      stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream, handleScanSuccess, onClose]);

  if (isNativeApp()) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-lg">
        <video ref={videoRef} className="w-full" playsInline muted autoPlay />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-muted-foreground text-sm">QR 코드를 카메라에 비춰주세요</p>
    </div>
  );
}
