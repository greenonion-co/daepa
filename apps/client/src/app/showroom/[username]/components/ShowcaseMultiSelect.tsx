"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";

interface ShowcaseMultiSelectProps {
  title: string;
  displayMap: Record<string, string>;
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  /** true이면 하나만 선택 가능 (선택 즉시 닫힘) */
  single?: boolean;
  /** 드롭다운 수평 정렬 */
  dropdownPosition?: "left" | "right";
  variant?: "default" | "light";
}

export default function ShowcaseMultiSelect({
  title,
  displayMap,
  selected,
  onChange,
  className,
  single = false,
  dropdownPosition = "left",
  variant = "default",
}: ShowcaseMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>(selected);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const localSelectedRef = useRef(localSelected);
  localSelectedRef.current = localSelected;

  const closeAndSave = useCallback(() => {
    setIsOpen(false);
    onChange(localSelectedRef.current);
  }, [onChange]);

  useEffect(() => {
    setLocalSelected(selected);
  }, [selected]);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeAndSave();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen, closeAndSave]);

  // Animation
  useEffect(() => {
    if (isOpen) {
      setIsEntering(false);
      const raf = requestAnimationFrame(() => setIsEntering(true));
      return () => cancelAnimationFrame(raf);
    }
    setIsEntering(false);
  }, [isOpen]);

  const isMobile = useIsMobile();
  const hasSelection = selected.length > 0;
  const selectList = Object.keys(displayMap);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "flex h-[32px] w-full cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium",
          hasSelection
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            : variant === "light"
              ? "bg-white text-gray-800 shadow-sm dark:bg-[#18171C] dark:text-gray-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        )}
        onClick={() => {
          if (isOpen) closeAndSave();
          else setIsOpen(true);
        }}
      >
        <div className="min-w-0 flex-1 truncate text-left">
          {title}
          {hasSelection &&
            selected[0] &&
            `\u30FB${displayMap[selected[0]] ?? selected[0]}${selected.length > 1 ? ` \uC678 ${selected.length - 1}\uAC1C` : ""}`}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0",
            hasSelection ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-10 z-50 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-[#18171C]",
            isMobile ? "w-48" : "w-[280px]",
            dropdownPosition === "right" ? "right-0" : "left-0",
            "transform transition-all duration-200 ease-out",
            isEntering
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-95 opacity-0",
          )}
        >
          <div className="mb-2 font-medium dark:text-gray-200">{title}</div>

          {!single && localSelected.length > 0 && (
            <div className="flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden pb-2">
              {localSelected.map((item) => (
                <div
                  key={item}
                  className="flex shrink-0 items-center whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                >
                  {displayMap[item] ?? item}
                  <button
                    type="button"
                    onClick={() => setLocalSelected((prev) => prev.filter((m) => m !== item))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="max-h-[240px] overflow-y-auto">
            {selectList.length === 0 ? (
              <p className="py-2 text-center text-sm text-gray-400">옵션 없음</p>
            ) : (
              selectList.map((item) => {
                const isItemSelected = localSelected.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between rounded-xl px-2 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                      isItemSelected && "text-blue-700 dark:text-blue-400",
                    )}
                    onClick={() => {
                      if (single) {
                        setLocalSelected([item]);
                        onChange([item]);
                        setIsOpen(false);
                      } else {
                        setLocalSelected((prev) =>
                          prev.includes(item) ? prev.filter((m) => m !== item) : [...prev, item],
                        );
                      }
                    }}
                  >
                    {displayMap[item] ?? item}
                    {isItemSelected && (
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
