"use client";

import { cn } from "@/lib/utils";

interface SelectableBadgeProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

/**
 * 옵션을 badge(rounded-full 토글) 형태로 보여주는 선택 버튼.
 * MultiSelect / FormMultiSelect / MultiSelectList 에서 공통 사용.
 */
export const SelectableBadge = ({ label, selected, onClick }: SelectableBadgeProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 active:scale-[0.97]",
      selected
        ? "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 text-white ring-1 ring-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_5px_rgba(0,0,0,0.3)] dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-300 dark:text-zinc-900 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_5px_rgba(0,0,0,0.4)]"
        : "bg-white text-gray-600 shadow-sm ring-1 ring-inset ring-gray-200 hover:ring-gray-300 dark:bg-gray-800/50 dark:text-gray-300 dark:ring-gray-700",
    )}
  >
    {label}
  </button>
);
