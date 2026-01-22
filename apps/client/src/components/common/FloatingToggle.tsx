"use client";

import { cn } from "@/lib/utils";

interface ToggleOption<T extends string> {
  label: string;
  value: T;
}

interface FloatingToggleProps<T extends string> {
  options: [ToggleOption<T>, ToggleOption<T>];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function FloatingToggle<T extends string>({
  options,
  value,
  onChange,
  className,
}: FloatingToggleProps<T>) {
  const [leftOption, rightOption] = options;
  const isRightSelected = value === rightOption.value;

  return (
    <div className={cn("bottom-17 fixed left-1/2 z-50 -translate-x-1/2", className)}>
      <div className="relative flex h-12 items-center rounded-full bg-neutral-900/90 p-1 shadow-lg dark:bg-gray-900/70">
        {/* 슬라이딩 배경 */}
        <div
          className={cn(
            "absolute h-10 w-[calc(50%-2px)] rounded-full bg-neutral-600 transition-all duration-300 ease-out",
            isRightSelected ? "left-[calc(50%-4px)]" : "left-1",
          )}
        />
        <button
          type="button"
          onClick={() => onChange(leftOption.value)}
          className="relative z-10 rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors duration-300"
        >
          {leftOption.label}
        </button>
        <button
          type="button"
          onClick={() => onChange(rightOption.value)}
          className="relative z-10 rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors duration-300"
        >
          {rightOption.label}
        </button>
      </div>
    </div>
  );
}
