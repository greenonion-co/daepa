"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SELECTOR_CONFIGS } from "../../constants";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { SelectItem } from "./SelectItem";

interface SingleSelectProps {
  type: keyof typeof SELECTOR_CONFIGS;
  initialItem?: any;
  onSelect?: (item: any) => void;
  disabled?: boolean;
  showTitle?: boolean;
  showSelectAll?: boolean; // 전체 선택 항목 표시
  saveASAP?: boolean; // 즉시 반영
}

const SingleSelect = ({
  type,
  initialItem,
  onSelect,
  disabled = false,
  showTitle = false,
  showSelectAll = false,
  saveASAP = false,
}: SingleSelectProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(initialItem);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"left" | "right">("right");

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

  // 드롭다운 위치 조정
  useEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // 수평 위치 결정
      const wouldOverflowRight = containerRect.left + dropdownRect.width > viewportWidth - 16;
      const horizontal = wouldOverflowRight ? "right" : "left";

      setDropdownPosition(horizontal);
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
          initialItem
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          disabled &&
            "cursor-not-allowed bg-white text-black dark:bg-neutral-900 dark:text-gray-200",
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
                "h-4 w-4 text-gray-600 dark:text-gray-400",
                initialItem
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400",
              )}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute top-10 z-50 w-[320px] rounded-2xl border-[1.8px] border-gray-200 bg-white p-5 shadow-lg dark:border-gray-600 dark:bg-gray-800",
            "transform transition-all duration-200 ease-out",
            // 수평 위치
            dropdownPosition === "left" ? "left-0" : "right-0",
            // 애니메이션 상태
            isEntering
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-95 opacity-0",
            isMobile && "w-48",
          )}
        >
          <div className="mb-2 font-[500] dark:text-gray-200">{SELECTOR_CONFIGS[type].title}</div>
          <div className="mb-2">
            {showSelectAll && (
              <SelectItem
                item={{
                  key: null,
                  value: "전체",
                }}
                isSelected={selectedItem === null}
                onClick={() => {
                  onSelect?.(null);
                  setIsOpen(false);
                }}
              />
            )}

            {SELECTOR_CONFIGS[type].selectList.map((item) => (
              <SelectItem
                key={item.key}
                item={item}
                isSelected={selectedItem === item.key}
                onClick={() => {
                  if (saveASAP) {
                    onSelect?.(item.key);
                    setIsOpen(false);
                  } else {
                    setSelectedItem(item.key);
                  }
                }}
              />
            ))}
          </div>

          {!saveASAP && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedItem(undefined);
                }}
                className="h-[32px] cursor-pointer rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                초기화
              </button>
              <button
                onClick={() => {
                  onSelect?.(selectedItem);
                  setIsOpen(false);
                }}
                className="h-[32px] cursor-pointer rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SingleSelect;
