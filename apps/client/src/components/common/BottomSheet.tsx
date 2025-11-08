"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  buttonText?: string;
  secondButtonText?: string;
  onSecondButtonClick?: () => void;
  onClick?: () => void;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  buttonText = "",
  secondButtonText = "",
  onSecondButtonClick = () => {},
  onClick = () => {},
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sheetElement = sheetRef.current;
    if (isOpen) sheetElement?.focus();

    return () => {
      sheetElement?.blur();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/10" onClick={onClose} />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className={`fixed bottom-4 left-1/2 z-[70] max-h-[90vh] min-h-[40vh] w-[calc(100%-24px)] max-w-2xl -translate-x-1/2 animate-[slideUp_0.3s_ease-out] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-3 shadow-md dark:border-gray-700 dark:bg-[#18181B] ${buttonText ? "pb-[calc(env(safe-area-inset-bottom)+80px)]" : "pb-[calc(env(safe-area-inset-bottom)+1rem)]"}`}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />
        {children}
        {buttonText && (
          <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 right-4 flex h-[48px] gap-2">
            {secondButtonText && (
              <button
                type="button"
                className="flex-[1] rounded-xl bg-gray-200 py-3 font-semibold"
                onClick={onSecondButtonClick}
              >
                {secondButtonText}
              </button>
            )}
            <button
              type="button"
              className="flex-[2] rounded-2xl bg-[#247DFE] py-3 font-bold text-white"
              onClick={onClick}
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
