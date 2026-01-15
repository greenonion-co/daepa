"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { buildR2TransformedUrl, cn } from "@/lib/utils";
import { IMAGE_TRANSFORMS } from "@/app/constants";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onExit?: () => void;
  imageUrl: string;
  fileName: string;
}

export default function ImageViewer({
  isOpen,
  onClose,
  onExit,
  imageUrl,
  fileName,
}: ImageViewerProps) {
  const [isXlLoaded, setIsXlLoaded] = useState(false);

  const needsXl = typeof window !== "undefined" && window.innerWidth >= 400;

  // 모달 닫힐 때 xl 로드 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsXlLoaded(false);
    }
  }, [isOpen]);

  // 컴포넌트 언마운트 시 onExit 호출
  useEffect(() => {
    return () => onExit?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 뒤로가기 버튼으로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    // 모달이 열릴 때 history state 추가
    const stateKey = "fullscreen-image-viewer";
    window.history.pushState({ [stateKey]: true }, "");

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // 모달이 닫힐 때 (뒤로가기가 아닌 경우) history 정리
      if (window.history.state?.[stateKey]) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="z-[9999] bg-black min-[900px]:bg-black/80" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-[9999] flex items-center justify-center bg-black",
            // 900px 미만: 전체화면
            "inset-0",
            // 900px 이상: Dialog 형태
            "min-[900px]:inset-auto min-[900px]:top-1/2 min-[900px]:left-1/2 min-[900px]:-translate-x-1/2 min-[900px]:-translate-y-1/2",
            "min-[900px]:h-[80vh] min-[900px]:max-h-[800px] min-[900px]:w-[80vw] min-[900px]:max-w-[1200px]",
            "min-[900px]:overflow-hidden min-[900px]:rounded-2xl",
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">이미지 전체화면 보기</DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-neutral-900 transition-colors hover:bg-white/80"
            aria-label="닫기"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative h-full w-full">
            {/* lg 이미지 (즉시 표시, xl 로드 완료 시 숨김) */}
            <Image
              src={buildR2TransformedUrl(imageUrl, IMAGE_TRANSFORMS.lg)}
              alt={`fullscreen_${fileName}`}
              fill
              className={cn(
                "object-contain transition-opacity duration-300",
                isXlLoaded && needsXl && "opacity-0",
              )}
              draggable={false}
              priority
            />

            {/* xl 이미지 (400px 이상에서만 로드, 완료 시 표시) */}
            {needsXl && (
              <Image
                src={buildR2TransformedUrl(imageUrl, IMAGE_TRANSFORMS.xl)}
                alt={`fullscreen_xl_${fileName}`}
                fill
                className={cn(
                  "object-contain transition-opacity duration-300",
                  isXlLoaded ? "opacity-100" : "opacity-0",
                )}
                draggable={false}
                onLoad={() => setIsXlLoaded(true)}
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
