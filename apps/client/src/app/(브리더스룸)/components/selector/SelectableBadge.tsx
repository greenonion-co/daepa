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
      "rounded-full border border-gray-200 px-3 py-1 text-center dark:border-gray-600 dark:hover:bg-gray-800",
      selected
        ? "bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900"
        : "hover:bg-gray-100 dark:text-gray-300",
    )}
  >
    {label}
  </button>
);
