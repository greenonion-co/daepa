"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import BadgeList from "@/app/(브리더스룸)/components/BadgeList";
import { SelectableBadge } from "@/app/(브리더스룸)/components/selector/SelectableBadge";

interface FormMultiSelectProps {
  title: string;
  displayMap: Record<string, string>;
  disabled?: boolean;
  initialItems?: string[];
  onSelect: (items?: string[]) => void;
  /** 데스크탑에서도 화면 중앙 모달로 표시 */
  forceCenter?: boolean;
}

const FormMultiSelect = ({
  title,
  displayMap,
  disabled = false,
  initialItems,
  onSelect,
  forceCenter,
}: FormMultiSelectProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[] | undefined>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  // 드롭다운이 열렸을 때의 초기 상태를 저장 (변경 여부 판단용)
  const openSnapshotRef = useRef<string[] | undefined>(undefined);
  const selectedItemsRef = useRef(selectedItems);
  selectedItemsRef.current = selectedItems;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const selectList = useMemo(() => Object.keys(displayMap), [displayMap]);

  useEffect(() => {
    setSelectedItems(initialItems);
  }, [initialItems]);

  // 드롭다운 닫힐 때 변경사항이 있으면 onSelect 호출
  const closeAndSave = useCallback(() => {
    setIsOpen(false);
    const snapshot = openSnapshotRef.current;
    const current = selectedItemsRef.current;
    const snapshotStr = JSON.stringify((snapshot ?? []).slice().sort());
    const currentStr = JSON.stringify((current ?? []).slice().sort());
    openSnapshotRef.current = undefined; // 저장 완료 마킹
    if (snapshotStr !== currentStr) {
      onSelectRef.current(current);
    }
  }, []);

  // 컴포넌트 언마운트 시 드롭다운이 열려있고 변경사항이 있으면 저장
  useEffect(() => {
    return () => {
      const snapshot = openSnapshotRef.current;
      if (snapshot === undefined) return; // 이미 저장됨 or 드롭다운이 열린 적 없음
      const current = selectedItemsRef.current;
      const snapshotStr = JSON.stringify((snapshot ?? []).slice().sort());
      const currentStr = JSON.stringify((current ?? []).slice().sort());
      if (snapshotStr !== currentStr) {
        onSelectRef.current(current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      openSnapshotRef.current = selectedItemsRef.current;
    }

    if (!isOpen) return;

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
  }, [isOpen, closeAndSave]);

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
            ? "bg-blue-50/70 text-gray-900 dark:bg-blue-900/10 dark:text-gray-100"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          disabled &&
            "cursor-not-allowed bg-blue-50/40 text-gray-900 dark:bg-blue-900/5 dark:text-gray-200",
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
          selectedItems && selectedItems.length > 0 ? (
            <BadgeList
              items={selectedItems.map((item) => displayMap[item] ?? item)}
              badgeSize={"md"}
              maxDisplay={isMobile ? 3 : 4}
              variant={
                (title === "모프" && "outline") || (title === "형질" && "secondary") || "secondary"
              }
            />
          ) : (
            <div>-</div>
          )
        ) : (
          <>
            {initialItems && initialItems.length > 0 ? (
              <div>{initialItems.map((item) => displayMap[item] ?? item).join(" | ")}</div>
            ) : (
              <div className="text-gray-400 dark:text-gray-500">{title} 선택하기</div>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-400" />
          </>
        )}
      </div>

      {isOpen && (isMobile || forceCenter) && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => closeAndSave()}
        />
      )}
      {isOpen && (
        <div
          className={cn(
            "z-50 w-[320px] rounded-2xl border-[1.8px] border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800",
            "transform transition-all duration-200 ease-out",
            isMobile || forceCenter
              ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              : "absolute top-[40px] left-0 origin-top",
            isEntering
              ? isMobile || forceCenter
                ? "scale-100 opacity-100"
                : "translate-y-0 scale-100 opacity-100"
              : isMobile || forceCenter
                ? "scale-95 opacity-0"
                : "-translate-y-1 scale-95 opacity-0",
          )}
        >
          <div className="mb-2 font-[500] dark:text-gray-100">{title}</div>
          {/* 선택된 항목 칩 */}
          {selectedItems && selectedItems.length > 0 && (
            <div className="mb-2 flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden pb-1">
              {selectedItems.map((item) => (
                <div
                  className="flex shrink-0 items-center rounded-full bg-blue-100 px-2 py-0.5 text-[12px] whitespace-nowrap text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                  key={item}
                >
                  {displayMap[item] ?? item}
                  <button
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedItems((prev) => prev?.filter((m) => m !== item));
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* 옵션 목록 (badge) */}
          <div className="mb-4 max-h-[240px] overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {selectList.map((item) => (
                <SelectableBadge
                  key={item}
                  label={displayMap[item] ?? item}
                  selected={!!selectedItems?.includes(item)}
                  onClick={() => {
                    setSelectedItems((prev) => {
                      if (prev?.includes(item)) {
                        return prev?.filter((m) => m !== item);
                      }
                      return [...(prev || []), item];
                    });
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => closeAndSave()}
              className="h-[32px] cursor-pointer rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormMultiSelect;
