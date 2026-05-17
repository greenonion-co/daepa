"use client";

import { createPortal } from "react-dom";

interface BottomSheetProps {
  onOpenApp: () => void;
  onContinueWeb: () => void;
}

export function BottomSheet({ onOpenApp, onContinueWeb }: BottomSheetProps) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50"
      onClick={onContinueWeb}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/apple-touch-icon.png"
            alt=""
            className="mb-3 h-16 w-16 rounded-2xl shadow-md ring-1 ring-black/5"
          />
          <h2 className="text-lg font-semibold text-neutral-900">브리디 앱에서 더 편하게 보기</h2>
          <p className="mt-1 text-center text-sm text-neutral-500">
            앱이 설치돼 있으면 자동으로 열리고,
            <br />
            없으면 스토어로 이동합니다.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenApp}
            className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            앱으로 열기
          </button>
          <button
            type="button"
            onClick={onContinueWeb}
            className="w-full rounded-xl py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            웹에서 계속 보기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
