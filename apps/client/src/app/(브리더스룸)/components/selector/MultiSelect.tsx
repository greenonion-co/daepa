"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { SelectableBadge } from "./SelectableBadge";
import BottomSheet from "@/components/common/BottomSheet";

interface MultiSelectProps {
  title: string;
  displayMap: Record<string, string>;
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  /** true이면 하나만 선택 가능 (선택 즉시 닫힘) */
  single?: boolean;
  variant?: "default" | "light";
  className?: string;
}

const MultiSelect = ({
  title,
  displayMap,
  selected,
  onChange,
  disabled = false,
  single = false,
  variant = "default",
  className,
}: MultiSelectProps) => {
  const isLight = variant === "light";
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>(selected);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"left" | "right">("right");

  const selectList = useMemo(() => Object.keys(displayMap), [displayMap]);
  const localSelectedRef = useRef(localSelected);
  localSelectedRef.current = localSelected;

  const closeAndSave = useCallback(() => {
    setIsOpen(false);
    onChange(localSelectedRef.current);
  }, [onChange]);

  const cancel = useCallback(() => {
    setLocalSelected(selected);
    setIsOpen(false);
  }, [selected]);

  // 외부 props 변경 시 로컬 동기화 (드롭다운 닫혀있을 때만 — 열린 상태에서는 진행 중인 선택 보존)
  useEffect(() => {
    if (!isOpen) {
      setLocalSelected(selected);
    }
  }, [selected, isOpen]);

  // 외부 클릭 시 저장 후 닫기 (데스크탑만 — 모바일은 오버레이로 처리)
  useEffect(() => {
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

  // 진입 애니메이션
  useEffect(() => {
    if (isOpen) {
      setIsEntering(false);
      const raf = requestAnimationFrame(() => setIsEntering(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);

  // 드롭다운 위치 자동 계산
  useEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      const wouldOverflowRight = containerRect.left + dropdownRect.width > viewportWidth - 16;
      setDropdownPosition(wouldOverflowRight ? "right" : "left");
    }
  }, [isOpen]);

  const hasSelection = selected.length > 0;

  const optionsBody =
    selectList.length === 0 ? (
      <p className="py-2 text-center text-sm text-gray-400">옵션 없음</p>
    ) : (
      <div className="flex flex-wrap gap-2 md:gap-1.5">
        {selectList.map((item) => (
          <SelectableBadge
            key={item}
            label={displayMap[item] ?? item}
            selected={localSelected.includes(item)}
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
          />
        ))}
      </div>
    );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "flex h-[32px] cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
          hasSelection
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            : isLight
              ? "bg-white text-gray-800 shadow-sm dark:bg-[#18171C] dark:text-gray-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
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
          selected.length > 0 ? (
            <div>{selected.map((item) => displayMap[item] ?? item).join(" | ")}</div>
          ) : (
            <div>-</div>
          )
        ) : (
          <>
            <div className="min-w-0 truncate text-left">
              {title}
              {hasSelection &&
                selected[0] &&
                `\u30FB${displayMap[selected[0]] ?? selected[0]}${selected.length > 1 ? ` 외 ${selected.length - 1}개` : ""}`}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0",
                hasSelection
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400",
              )}
            />
          </>
        )}
      </button>

      {isMobile ? (
        <BottomSheet
          isOpen={isOpen}
          onClose={cancel}
          buttonText={single ? "" : "적용"}
          secondButtonText={single ? "" : "취소"}
          onSecondButtonClick={cancel}
          onClick={closeAndSave}
        >
          <h2 className="mb-3 pl-1 text-xl font-bold dark:text-gray-200">{title}</h2>
          {optionsBody}
        </BottomSheet>
      ) : (
        isOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              "z-50 w-[280px] rounded-2xl border-[1.8px] border-gray-200 bg-white p-5 shadow-lg dark:border-gray-600 dark:bg-[#18171C]",
              "transform transition-all duration-200 ease-out",
              "absolute top-10",
              dropdownPosition === "left" ? "left-0" : "right-0",
              isEntering
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-1 scale-95 opacity-0",
            )}
          >
            <div className="mb-2 font-[500] dark:text-gray-200">{title}</div>

            {/* 옵션 목록 (badge) */}
            <div className="mb-2 max-h-[240px] overflow-y-auto">{optionsBody}</div>

            {/* 취소 / 적용 버튼 (multi 모드만) */}
            {!single && (
              <div className="mt-2 flex items-center gap-3 pt-3">
                <button
                  type="button"
                  className="text-[13px] font-medium text-gray-400 transition-colors hover:text-gray-600 active:text-gray-800 dark:text-gray-500 dark:hover:text-gray-300"
                  onClick={cancel}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="ml-auto rounded-full bg-gray-900 px-5 py-1.5 text-[13px] font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.96] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  onClick={() => closeAndSave()}
                >
                  적용
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default MultiSelect;
