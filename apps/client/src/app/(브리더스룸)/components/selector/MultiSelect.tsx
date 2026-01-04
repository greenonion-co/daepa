"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFilterStore } from "../../store/filter";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { SelectItem } from "./SelectItem";

interface MultiSelectFilterProps {
  type: "morphs" | "traits" | "foods" | "growth" | "sex" | "status";
  title: string;
  disabled?: boolean;
  displayMap: Record<string, string>; // key -> display label 매핑 (UI 표시용, 있으면 내부적으로 Object.keys(displayMap)을 selectList로 사용)
}

const MultiSelectFilter = ({
  type,
  title,
  disabled = false,
  displayMap,
}: MultiSelectFilterProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { searchFilters, setSearchFilters } = useFilterStore();
  const [selectedItem, setSelectedItem] = useState<string[] | undefined>(searchFilters[type]);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"left" | "right">("right");

  const selectList = useMemo(() => Object.keys(displayMap), [displayMap]);

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

  useEffect(() => {
    setSelectedItem(searchFilters[type]);
  }, [searchFilters, type]);

  const currentFilterValue = useMemo(() => searchFilters[type], [searchFilters, type]);

  // 수정사항이 있는지 확인
  const hasChanges = useMemo(() => {
    const current = searchFilters[type] || [];
    const selected = selectedItem || [];

    if (current.length !== selected.length) return true;

    // 순서 상관없이 같은 요소를 가지고 있는지 확인
    const currentSet = new Set(current);
    const selectedSet = new Set(selected);

    for (const item of currentSet) {
      if (!selectedSet.has(item)) return true;
    }

    return false;
  }, [searchFilters, type, selectedItem]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(
          "flex h-[32px] cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
          currentFilterValue && currentFilterValue.length > 0
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
      >
        {disabled ? (
          selectedItem && selectedItem.length > 0 ? (
            <div>{selectedItem.map((item) => displayMap[item] ?? item).join(" | ")}</div>
          ) : (
            <div>-</div>
          )
        ) : (
          <>
            <div>
              {title}
              {currentFilterValue &&
                currentFilterValue.length > 0 &&
                currentFilterValue[0] &&
                `・${displayMap[currentFilterValue[0]] ?? currentFilterValue[0]} ${currentFilterValue.length > 1 ? `외 ${currentFilterValue.length - 1}개` : ""}`}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-600 dark:text-gray-400",
                currentFilterValue
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
          <div className="mb-2 font-[500] dark:text-gray-200">{title}</div>
          {selectedItem && selectedItem.length > 0 && (
            <div className={"flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden pb-2"}>
              {selectedItem.map((item) => {
                return (
                  <div
                    className="flex shrink-0 items-center whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-[12px] text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                    key={item}
                  >
                    {displayMap[item]}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItem((prev) => {
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
          )}
          <div className="mb-4 max-h-[240px] overflow-y-auto">
            {selectList?.map((item) => {
              return (
                <SelectItem
                  key={item}
                  item={{
                    key: item,
                    value: displayMap[item] ?? "",
                  }}
                  isSelected={selectedItem?.includes(item) ?? false}
                  onClick={() => {
                    setSelectedItem((prev) => {
                      if (prev?.includes(item)) {
                        return prev?.filter((m) => m !== item);
                      }
                      return [...(prev || []), item];
                    });
                  }}
                />
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedItem(undefined);
              }}
              disabled={!hasChanges}
              className={cn(
                "h-[32px] rounded-lg px-3 text-sm font-semibold",
                hasChanges
                  ? "cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  : "cursor-not-allowed bg-gray-50 text-gray-400 dark:bg-gray-700/50 dark:text-gray-500",
              )}
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchFilters({
                  ...searchFilters,
                  [type]: selectedItem,
                });
                setIsOpen(false);
              }}
              disabled={!hasChanges}
              className={cn(
                "h-[32px] rounded-lg px-3 text-sm font-semibold",
                hasChanges
                  ? "cursor-pointer bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500",
              )}
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
