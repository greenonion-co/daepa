"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SELECTOR_CONFIGS } from "../constants";
import { Check, ChevronDown } from "lucide-react";

interface SingleSelectProps {
  type: keyof typeof SELECTOR_CONFIGS;
  initialItem?: any;
  onSelect: (item: any) => void;
  disabled?: boolean;
  showTitle?: boolean;
}

const SingleSelect = ({
  type,
  initialItem,
  onSelect,
  disabled = false,
  showTitle = false,
}: SingleSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(initialItem);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const root = containerRef.current;
      if (root && !root.contains(event.target as Node)) {
        setSelectedItem(initialItem);
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen, initialItem]);

  useEffect(() => {
    setSelectedItem(initialItem);
  }, [initialItem]);

  useEffect(() => {
    if (isOpen) {
      setIsEntering(false);
      const raf = requestAnimationFrame(() => setIsEntering(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex h-[32px] w-fit cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
          initialItem ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-800",
          disabled && "cursor-not-allowed",
        )}
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
        }}
      >
        {disabled ? (
          <div>
            {initialItem
              ? SELECTOR_CONFIGS[type].selectList.find((item) => item.key === initialItem)?.value
              : "-"}
          </div>
        ) : (
          <>
            <div>
              {showTitle && SELECTOR_CONFIGS[type].title}
              {showTitle && initialItem && "・"}
              {initialItem &&
                `${SELECTOR_CONFIGS[type].selectList.find((item) => item.key === initialItem)?.value}`}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-600",
                initialItem ? "text-blue-600" : "text-gray-600",
              )}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-[40px] z-50 w-[320px] rounded-2xl border-[1.8px] border-gray-200 bg-white p-5 shadow-lg",
            "origin-top transform transition-all duration-200 ease-out",
            isEntering
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-95 opacity-0",
          )}
        >
          <div className="mb-2 font-[500]">{SELECTOR_CONFIGS[type].title}</div>
          <div className="mb-4">
            {SELECTOR_CONFIGS[type].selectList.map((item) => {
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-2 py-2 text-gray-600 hover:bg-gray-100",
                    selectedItem === item.key && "text-blue-700",
                  )}
                  onClick={() => {
                    setSelectedItem(item.key);
                  }}
                >
                  {item.value}

                  {selectedItem === item.key && <Check className="h-4 w-4 text-blue-600" />}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setSelectedItem(undefined);
              }}
              className="h-[32px] cursor-pointer rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200"
            >
              초기화
            </button>
            <button
              onClick={() => {
                onSelect(selectedItem);
                setIsOpen(false);
              }}
              className="h-[32px] cursor-pointer rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleSelect;
