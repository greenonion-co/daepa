"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  buttonText?: string;
  secondButtonText?: string;
  onSecondButtonClick?: () => void;
  onClick?: () => void;
  fullWidth?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  buttonText = "",
  secondButtonText = "",
  onSecondButtonClick = () => {},
  onClick = () => {},
  fullWidth = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { state, isMobile } = useSidebar();

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
        className={`fixed bottom-4 z-[70] transition-all duration-300 ${
          fullWidth
            ? state === "expanded" && !isMobile
              ? "left-[280px] right-4 w-[calc(100%-300px)]"
              : "left-4 right-4 w-[calc(100%-32px)]"
            : `w-[calc(100%-24px)] max-w-2xl ${
                state === "expanded" && !isMobile
                  ? "left-[calc(127px+50%)] -translate-x-1/2"
                  : "left-1/2 -translate-x-1/2"
              }`
        }`}
      >
        <div className="max-h-[90vh] min-h-[40vh] animate-[slideUp_0.3s_ease-out] overflow-y-auto rounded-2xl bg-white p-3 pb-20 dark:bg-[#18181B]">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200" />
          {children}
          {buttonText && (
            <div className="absolute bottom-4 left-4 right-4 flex h-[48px] gap-2">
              {secondButtonText && (
                <button
                  className="flex-[1] rounded-xl bg-gray-200 py-3 font-semibold"
                  onClick={onSecondButtonClick}
                >
                  {secondButtonText}
                </button>
              )}
              <button
                className="flex-[2] rounded-xl bg-[#247DFE] py-3 font-bold text-white"
                onClick={onClick}
              >
                {buttonText}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
