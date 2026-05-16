"use client";

import { X } from "lucide-react";

interface BannerProps {
  onOpenApp: () => void;
  onDismiss: () => void;
}

export function Banner({ onOpenApp, onDismiss }: BannerProps) {
  return (
    <div className="flex items-center gap-3 bg-neutral-900 px-4 py-2.5 text-white">
      <div className="min-w-0 flex-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/apple-touch-icon.png"
          alt=""
          className="mb-3 h-16 w-16 rounded-2xl shadow-md ring-1 ring-black/5"
        />
        <div className="text-sm font-medium">브리디 앱에서 보기</div>
        <div className="truncate text-xs text-neutral-400">더 빠르고 편리한 경험을 제공합니다</div>
      </div>
      <button
        type="button"
        onClick={onOpenApp}
        className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
      >
        앱으로 보기
      </button>
      <button
        type="button"
        aria-label="배너 닫기"
        onClick={onDismiss}
        className="text-neutral-400 hover:text-white"
      >
        <X size={18} />
      </button>
    </div>
  );
}
