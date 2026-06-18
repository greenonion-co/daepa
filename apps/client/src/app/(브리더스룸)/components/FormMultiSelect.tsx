"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import BadgeList from "@/app/(브리더스룸)/components/BadgeList";
import { SelectableBadge } from "@/app/(브리더스룸)/components/selector/SelectableBadge";
import BottomSheet from "@/components/common/BottomSheet";

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
    if (isOpen) {
      setIsEntering(false);
      const raf = requestAnimationFrame(() => setIsEntering(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);

  const optionsBody = (
    <div className="flex flex-wrap gap-2 md:gap-1.5">
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
  );

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
              <div>{initialItems.map((item) => displayMap[item] ?? item).join(" · ")}</div>
            ) : (
              <div className="text-gray-400 dark:text-gray-500">{title} 선택하기</div>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-400" />
          </>
        )}
      </div>

      {isMobile ? (
        <BottomSheet isOpen={isOpen} onClose={closeAndSave} buttonText="닫기" onClick={closeAndSave}>
          <h2 className="mb-3 pl-1 text-xl font-bold dark:text-gray-100">{title}</h2>
          <div className="max-h-[50dvh] overflow-y-auto">{optionsBody}</div>
        </BottomSheet>
      ) : (
        <>
          {isOpen && forceCenter && (
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => closeAndSave()} />
          )}
          {isOpen && (
            <div
              className={cn(
                "z-50 w-[320px] rounded-2xl border-[1.8px] border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800",
                "transform transition-all duration-200 ease-out",
                forceCenter
                  ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  : "absolute top-[40px] left-0 origin-top",
                isEntering
                  ? forceCenter
                    ? "scale-100 opacity-100"
                    : "translate-y-0 scale-100 opacity-100"
                  : forceCenter
                    ? "scale-95 opacity-0"
                    : "-translate-y-1 scale-95 opacity-0",
              )}
            >
              <div className="mb-2 font-[500] dark:text-gray-100">{title}</div>
              {/* 옵션 목록 (badge) */}
              <div className="mb-4 max-h-[240px] overflow-y-auto">{optionsBody}</div>

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
        </>
      )}
    </div>
  );
};

export default FormMultiSelect;
