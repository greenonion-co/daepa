"use client";

import { useEffect } from "react";

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
      <div className="fixed inset-0 z-[60]" onClick={onClose} />

      <div className="rounded-4xl fixed bottom-4 left-1/2 z-[70] max-h-[90vh] min-h-[40vh] w-[calc(100%-24px)] max-w-2xl -translate-x-1/2 animate-[slideUp_0.3s_ease-out] overflow-y-auto border border-gray-200 bg-white p-3 pb-20 shadow-md dark:bg-[#18181B]">
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
