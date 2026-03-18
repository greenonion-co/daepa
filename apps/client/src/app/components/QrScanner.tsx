"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import jsQR from "jsqr";
import { isNativeApp, sendToNative } from "@/lib/native-bridge";
import { useAppRouter } from "@/hooks/useAppRouter";
import { toast } from "sonner";
import { Camera } from "lucide-react";

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

function decodeQrFromImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      resolve(code?.data ?? null);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

interface QrScannerStreamProps {
  mode: "stream";
  stream: MediaStream;
  onClose?: () => void;
}

interface QrScannerCaptureProps {
  mode: "capture";
  onClose?: () => void;
}

type QrScannerProps = QrScannerStreamProps | QrScannerCaptureProps;

export default function QrScanner(props: QrScannerProps) {
  const { onClose } = props;
  const router = useAppRouter();

  if (isNativeApp()) {
    sendToNative({ type: "OPEN_QR_SCANNER" });
    onClose?.();
    return null;
  }

  if (props.mode === "stream") {
    return <StreamScanner stream={props.stream} onClose={onClose} router={router} />;
  }

  return <CaptureScanner onClose={onClose} router={router} />;
}

// --- Stream 방식 (Safari, Android Chrome 등) ---

function StreamScanner({
  stream,
  onClose,
  router,
}: {
  stream: MediaStream;
  onClose?: () => void;
  router: ReturnType<typeof useAppRouter>;
}) {
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

// --- Capture 방식 (iOS Chrome 등 getUserMedia 미지원) ---

function CaptureScanner({
  onClose,
  router,
}: {
  onClose?: () => void;
  router: ReturnType<typeof useAppRouter>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      const data = await decodeQrFromImage(file);
      setIsProcessing(false);

      if (!data) {
        toast.error("QR 코드를 인식할 수 없습니다. 다시 촬영해주세요.");
        // input 초기화하여 같은 파일 재선택 가능
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const path = extractPathFromQrUrl(data);
      if (path) {
        router.push(path);
        onClose?.();
      } else {
        toast.error("서비스에서 지원하지 않는 QR 코드입니다.");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [router, onClose],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-muted-foreground text-sm">
        이 브라우저에서는 카메라로 QR 코드를 촬영하여 스캔합니다.
      </p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2.5 text-sm font-medium text-white transition-colors active:bg-neutral-700 disabled:opacity-50"
      >
        <Camera className="h-4 w-4" />
        {isProcessing ? "인식 중..." : "카메라로 촬영"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
