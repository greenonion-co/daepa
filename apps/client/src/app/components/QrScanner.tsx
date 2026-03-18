"use client";

import { useRef, useCallback, useEffect } from "react";
import jsQR from "jsqr";
import { useAppRouter } from "@/hooks/useAppRouter";
import { toast } from "sonner";

const SERVICE_DOMAINS = ["breedy.kr", "www.breedy.kr"];

/** jsQR 디코딩 해상도 — 낮을수록 빠르지만 인식률 하락. 320은 QR에 충분 */
const SCAN_SIZE = 320;
/** 최소 스캔 간격(ms) — rAF 기반이지만 jsQR 호출을 throttle */
const MIN_SCAN_GAP = 80;

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

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      if (scanLockRef.current) return;
      scanLockRef.current = true;

      const path = extractPathFromQrUrl(decodedText);
      if (path) {
        // 즉시 stream 해제 후 네비게이션
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
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = SCAN_SIZE;
    canvas.height = SCAN_SIZE;

    video.srcObject = stream;
    video.play().catch(() => {});

    let active = true;
    let lastScanTime = 0;

    const scan = (now: number) => {
      if (!active) return;

      if (
        !scanLockRef.current &&
        now - lastScanTime >= MIN_SCAN_GAP &&
        video.readyState >= video.HAVE_ENOUGH_DATA
      ) {
        lastScanTime = now;
        ctx.drawImage(video, 0, 0, SCAN_SIZE, SCAN_SIZE);
        const imageData = ctx.getImageData(0, 0, SCAN_SIZE, SCAN_SIZE);
        const code = jsQR(imageData.data, SCAN_SIZE, SCAN_SIZE);

        if (code?.data) {
          handleScanSuccess(code.data);
          return;
        }
      }

      requestAnimationFrame(scan);
    };

    requestAnimationFrame(scan);

    return () => {
      active = false;
      stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream, handleScanSuccess]);

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
