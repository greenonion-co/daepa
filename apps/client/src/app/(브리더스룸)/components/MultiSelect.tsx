"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";

interface MultiSelectProps {
  title: string;
  selectList: string[];
  disabled?: boolean;
  initialItems: string[];
  onSelect: (items?: string[]) => void;
}

const MultiSelect = ({
  title,
  selectList,
  disabled = false,
  initialItems,
  onSelect,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[] | undefined>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    setSelectedItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const root = containerRef.current;
      if (root && !root.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

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
      <div
        className={cn(
          "flex min-h-[32px] cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
          selectedItems && selectedItems.length > 0
            ? "bg-blue-100 text-blue-600"
            : "bg-gray-100 text-gray-800",
          disabled && "cursor-not-allowed",
        )}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
      >
        {disabled ? (
          selectedItems && selectedItems.length > 0 ? (
            <div>{selectedItems?.join(" | ")}</div>
          ) : (
            <div>-</div>
          )
        ) : (
          <>
            <div>
              {title}
              {selectedItems &&
                selectedItems.length > 0 &&
                `・${selectedItems[0]} ${selectedItems.length > 1 ? `외 ${selectedItems.length - 1}개` : ""}`}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-600",
                selectedItems ? "text-blue-600" : "text-gray-600",
              )}
            />
          </>
        )}
      </div>

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
          <div className="mb-2 font-[500]">{title}</div>
          <div className="mb-2 flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden pb-1">
            {selectedItems?.map((item) => {
              return (
                <div
                  className="flex shrink-0 items-center whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-[12px] text-blue-600"
                  key={item}
                >
                  {item}
                  <button
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedItems((prev) => {
                        return prev?.filter((m) => m !== item);
                      });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mb-4 max-h-[240px] overflow-y-auto">
            {selectList.map((item) => {
              return (
                <div
                  key={item}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-2 py-2 text-gray-600 hover:bg-gray-100",
                    selectedItems?.includes(item) && "text-blue-700",
                  )}
                  onClick={() => {
                    setSelectedItems((prev) => {
                      if (prev?.includes(item)) {
                        return prev?.filter((m) => m !== item);
                      }
                      return [...(prev || []), item];
                    });
                  }}
                >
                  {item}

                  {selectedItems?.includes(item) && <Check className="h-4 w-4 text-blue-600" />}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setSelectedItems(undefined);
              }}
              className="h-[32px] cursor-pointer rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200"
            >
              초기화
            </button>
            <button
              onClick={() => {
                onSelect(selectedItems);
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

export default MultiSelect;
