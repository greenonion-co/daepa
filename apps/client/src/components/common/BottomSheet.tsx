"use client";

import { useEffect, useRef, useState } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  buttonText?: string;
  secondButtonText?: string;
  onSecondButtonClick?: () => void;
  onClick?: () => void;
  buttonDisabled?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  buttonText = "",
  secondButtonText = "",
  onSecondButtonClick = () => {},
  onClick = () => {},
  buttonDisabled = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  useEffect(() => {
    const sheetElement = sheetRef.current;
    if (isOpen) sheetElement?.focus();

    return () => {
      sheetElement?.blur();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isVisible]);

  // 뒤로가기 시 바텀시트 닫기
  useEffect(() => {
    if (!isOpen) return;

    history.pushState({ bottomSheet: true }, "");

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/10 transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className={`fixed bottom-4 left-1/2 z-[70] max-h-[90ddvh] min-h-[40dvh] w-[calc(100%-24px)] max-w-2xl -translate-x-1/2 overflow-y-auto rounded-3xl border border-gray-200 bg-white p-3 shadow-md transition-transform duration-300 ease-out md:left-[calc(50%-var(--right-sidebar-width)/2)] dark:border-gray-700 dark:bg-[#18171C] ${isClosing ? "translate-y-full" : "animate-[slideUp_0.3s_ease-out]"} ${buttonText ? "pb-[calc(env(safe-area-inset-bottom)+80px)]" : "pb-[calc(env(safe-area-inset-bottom)+1rem)]"}`}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-[#101012]" />
        {children}
        {buttonText && (
          <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 right-4 flex h-[52px] gap-2">
            {secondButtonText && (
              <button
                type="button"
                className="flex-[1] rounded-xl bg-gray-200 py-3 font-semibold dark:bg-gray-700 dark:text-gray-200"
                onClick={onSecondButtonClick}
              >
                {secondButtonText}
              </button>
            )}
            <button
              type="button"
              className="flex-[2] rounded-xl bg-black py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onClick}
              disabled={buttonDisabled}
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
