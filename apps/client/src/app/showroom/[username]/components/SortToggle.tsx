"use client";

import { cn } from "@/lib/utils";

export const SORT_DESC = "hatchingDate:DESC"; // 최신순 (기본값)
export const SORT_ASC = "hatchingDate:ASC"; // 오래된순

interface SortToggleProps {
  /** 현재 정렬 값 (SORT_DESC | SORT_ASC) */
  value: string;
  onChange: (value: string) => void;
  /** 정렬 기준 라벨 */
  label?: string;
  className?: string;
}

/**
 * 한 번 누르면 정렬 방향이 전환되고, 다시 누르면 원복되는 토글 버튼.
 * 위/아래 삼각형으로 방향을 표현하고, 현재 선택된 방향의 삼각형을 짙게 표시한다.
 */
export default function SortToggle({
  value,
  onChange,
  label = "해칭일",
  className,
}: SortToggleProps) {
  const isDesc = value !== SORT_ASC; // 기본값(최신순) 포함 DESC로 취급
  const handleToggle = () => onChange(isDesc ? SORT_ASC : SORT_DESC);

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`${label} 정렬: ${isDesc ? "최신순" : "오래된순"} (눌러서 전환)`}
      title={isDesc ? "최신순" : "오래된순"}
      className={cn(
        "flex h-[32px] shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.96] dark:bg-[#18171C] dark:text-gray-200 dark:hover:bg-gray-800",
        className,
      )}
    >
      <span>{label}</span>
      <span className="flex flex-col items-center justify-center gap-[3px]">
        {/* 오래된순(ASC) — 위쪽 삼각형 */}
        <svg
          width="9"
          height="6"
          viewBox="0 0 10 6"
          className={cn(
            "transition-colors",
            !isDesc
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-300 dark:text-gray-600",
          )}
        >
          <path d="M5 0L10 6H0L5 0Z" fill="currentColor" />
        </svg>
        {/* 최신순(DESC) — 아래쪽 삼각형 */}
        <svg
          width="9"
          height="6"
          viewBox="0 0 10 6"
          className={cn(
            "transition-colors",
            isDesc
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-300 dark:text-gray-600",
          )}
        >
          <path d="M0 0H10L5 6L0 0Z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
