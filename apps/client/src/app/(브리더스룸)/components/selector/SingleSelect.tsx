"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SELECTOR_CONFIGS } from "../../constants";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { SelectableBadge } from "./SelectableBadge";
import BottomSheet from "@/components/common/BottomSheet";

interface SingleSelectProps {
  type: keyof typeof SELECTOR_CONFIGS;
  initialItem?: any;
  onSelect?: (item: any) => void;
  disabled?: boolean;
  showTitle?: boolean;
  showSelectAll?: boolean; // 전체 선택 항목 표시
  variant?: "default" | "light" | "form";
  /** 선택된 값이 있으면 타이틀 숨김 (값만 표시) */
  hideTitleOnSelect?: boolean;
  /** 데스크탑에서도 화면 중앙 모달로 표시 */
  forceCenter?: boolean;
}

const SingleSelect = ({
  type,
  initialItem,
  onSelect,
  disabled = false,
  showTitle = false,
  showSelectAll = false,
  variant = "default",
  hideTitleOnSelect = false,
  forceCenter,
}: SingleSelectProps) => {
  const isLight = variant === "light";
  const isForm = variant === "form";
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(initialItem);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"left" | "right">("right");
  const selectedItemRef = useRef(selectedItem);
  selectedItemRef.current = selectedItem;

  const closeAndSave = useCallback(() => {
    setIsOpen(false);
    if (selectedItemRef.current !== initialItem) {
      onSelect?.(selectedItemRef.current);
    }
  }, [initialItem, onSelect]);

  useEffect(() => {
    // 모바일은 BottomSheet가 자체 오버레이로 닫기를 처리
    if (!isOpen || isMobile) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const root = containerRef.current;
      if (root && !root.contains(event.target as Node)) {
        closeAndSave();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen, isMobile, closeAndSave]);

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

  const config = SELECTOR_CONFIGS[type];

  const optionsBody = (
    <div className="flex flex-wrap gap-2 md:gap-1.5">
      {showSelectAll && (
        <SelectableBadge
          label="전체"
          selected={selectedItem === null}
          onClick={() => {
            onSelect?.(null);
            setIsOpen(false);
          }}
        />
      )}
      {config.selectList.map((item) => (
        <SelectableBadge
          key={item.key}
          label={item.value}
          selected={selectedItem === item.key}
          onClick={() => {
            onSelect?.(item.key);
            setIsOpen(false);
          }}
        />
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex h-[32px] w-fit cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
          initialItem
            ? isForm
              ? "bg-blue-50/70 text-gray-900 dark:bg-blue-900/10 dark:text-gray-100"
              : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
            : isLight
              ? "bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          disabled &&
            (isForm
              ? "cursor-not-allowed bg-blue-50/40 text-gray-900 dark:bg-blue-900/5 dark:text-gray-200"
              : "cursor-not-allowed bg-white text-black dark:bg-neutral-900 dark:text-gray-200"),
        )}
        onClick={() => {
          if (disabled) return;
          if (isOpen) {
            closeAndSave();
          } else {
            setIsOpen(true);
          }
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
              {showTitle && !(hideTitleOnSelect && initialItem) && SELECTOR_CONFIGS[type].title}
              {showTitle && !(hideTitleOnSelect && initialItem) && initialItem && "・"}
              {initialItem &&
                `${SELECTOR_CONFIGS[type].selectList.find((item) => item.key === initialItem)?.value}`}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-600 dark:text-gray-400",
                initialItem && !isForm
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400",
              )}
            />
          </>
        )}
      </button>

      {isMobile ? (
        <BottomSheet isOpen={isOpen} onClose={closeAndSave}>
          <h2 className="mb-3 pl-1 text-xl font-bold dark:text-gray-200">{config.title}</h2>
          <div className="max-h-[50dvh] overflow-y-auto">{optionsBody}</div>
        </BottomSheet>
      ) : (
        <>
          {isOpen && forceCenter && (
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => closeAndSave()} />
          )}
          {isOpen && (
            <div
              ref={dropdownRef}
              className={cn(
                "z-50 w-80 rounded-2xl border-[1.8px] border-gray-200 bg-white p-5 shadow-lg dark:border-gray-600 dark:bg-[#18171C]",
                "transform transition-all duration-200 ease-out",
                forceCenter
                  ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  : cn("absolute top-10", dropdownPosition === "left" ? "left-0" : "right-0"),
                isEntering
                  ? forceCenter
                    ? "scale-100 opacity-100"
                    : "translate-y-0 scale-100 opacity-100"
                  : forceCenter
                    ? "scale-95 opacity-0"
                    : "-translate-y-1 scale-95 opacity-0",
              )}
            >
              <div className="mb-2 font-[500] dark:text-gray-200">{config.title}</div>
              <div className="mb-2 max-h-[240px] overflow-y-auto">{optionsBody}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SingleSelect;
