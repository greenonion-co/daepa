"use client";

import { useEffect, useRef, useState } from "react";
import { useAdoptionFilterStore } from "../../store/adoptionFilter";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { isNotNil } from "es-toolkit";
import { useIsMobile } from "@/hooks/useMobile";

const AdoptionDateRangeFilter = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { searchFilters, setSearchFilters } = useAdoptionFilterStore();

  const getDateString = (date: Date | string | undefined): string => {
    if (!date) return "";
    try {
      const dateStr = new Date(date).toISOString().split("T")[0];
      return dateStr || "";
    } catch {
      return "";
    }
  };

  // 로컬 state로 임시 날짜 관리
  const [tempStartDate, setTempStartDate] = useState<string>("");
  const [tempEndDate, setTempEndDate] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const root = containerRef.current;

      // 컨테이너 내부를 클릭한 경우 무시
      if (root && root.contains(target)) {
        return;
      }

      // 외부 클릭인 경우 닫기
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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

  const hasFilter = searchFilters.startDate !== undefined || searchFilters.endDate !== undefined;

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  };

  const displayText = () => {
    if (isNotNil(searchFilters.startDate) && isNotNil(searchFilters.endDate)) {
      return `분양 날짜・${formatDate(searchFilters.startDate)} ~ ${formatDate(searchFilters.endDate)}`;
    }
    if (searchFilters.startDate) {
      return `분양 날짜・${formatDate(searchFilters.startDate)} 이후`;
    }
    if (searchFilters.endDate) {
      return `분양 날짜・${formatDate(searchFilters.endDate)} 이전`;
    }
    return "분양 날짜";
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(
          "flex h-[32px] cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
          hasFilter
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => {
          if (!isOpen) {
            // 모달을 열 때 현재 필터 값으로 초기화
            setTempStartDate(getDateString(searchFilters.startDate));
            setTempEndDate(getDateString(searchFilters.endDate));
          }
          setIsOpen(!isOpen);
        }}
      >
        <div>{displayText()}</div>
        <ChevronDown
          className={cn(
            "h-4 w-4",
            hasFilter ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-[40px] z-50 rounded-2xl border-[1.8px] border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800",
            "origin-top transform transition-all duration-200 ease-out",
            isEntering
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-95 opacity-0",
            isMobile ? "w-[200px] p-3" : "w-[320px] p-5",
          )}
        >
          <div
            className={cn("font-[500] dark:text-gray-100", isMobile ? "mb-2 text-[13px]" : "mb-4")}
          >
            분양 날짜
          </div>
          <div className={cn("flex items-center gap-1", isMobile ? "mb-2" : "mb-4")}>
            <div className="min-w-0 flex-1">
              <label
                className={cn(
                  "mb-1 block text-gray-600 dark:text-gray-400",
                  isMobile ? "text-[12px]" : "text-xs",
                )}
              >
                시작
              </label>
              <input
                type="date"
                value={tempStartDate}
                max={tempEndDate || undefined}
                onChange={(e) => setTempStartDate(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-gray-200 bg-white px-1.5 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200",
                  isMobile ? "h-[28px] text-[12px]" : "h-[32px] text-sm",
                )}
              />
            </div>
            <div className={cn("text-gray-400 dark:text-gray-500", isMobile ? "mt-4" : "mt-5")}>
              ~
            </div>
            <div className="min-w-0 flex-1">
              <label
                className={cn(
                  "mb-1 block text-gray-600 dark:text-gray-400",
                  isMobile ? "text-[12px]" : "text-xs",
                )}
              >
                종료
              </label>
              <input
                type="date"
                value={tempEndDate}
                min={tempStartDate || undefined}
                onChange={(e) => setTempEndDate(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-gray-200 bg-white px-1.5 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200",
                  isMobile ? "h-[28px] text-[12px]" : "h-[32px] text-sm",
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setTempStartDate("");
                setTempEndDate("");
                setSearchFilters({
                  ...searchFilters,
                  startDate: undefined,
                  endDate: undefined,
                });
              }}
              className={cn(
                "cursor-pointer rounded-lg bg-gray-100 font-semibold text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
                isMobile ? "h-[28px] px-2 text-[12px]" : "h-[32px] px-3 text-sm",
              )}
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchFilters({
                  ...searchFilters,
                  startDate: tempStartDate || undefined,
                  endDate: tempEndDate || undefined,
                });
                setIsOpen(false);
              }}
              className={cn(
                "cursor-pointer rounded-lg bg-blue-500 font-semibold text-white hover:bg-blue-600",
                isMobile ? "h-[28px] px-2 text-[12px]" : "h-[32px] px-3 text-sm",
              )}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdoptionDateRangeFilter;
