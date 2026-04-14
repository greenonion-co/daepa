"use client";

import { LayoutGrid, Table } from "lucide-react";
import { cn } from "@/lib/utils";
import { useViewMode, ViewMode, ViewModeKey } from "../../store/viewMode";

export default function ViewModeToggle({ viewModeKey }: { viewModeKey?: ViewModeKey }) {
  const { viewMode, setViewMode } = useViewMode(viewModeKey);

  const buttons: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "table", icon: <Table className="h-4 w-4" />, label: "테이블" },
    { mode: "card", icon: <LayoutGrid className="h-4 w-4" />, label: "카드" },
  ];

  return (
    <div className="flex rounded-lg border border-neutral-200 bg-gray-100 p-0.5 dark:border-neutral-700 dark:bg-neutral-800">
      {buttons.map(({ mode, icon, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => setViewMode(mode)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            viewMode === mode
              ? "bg-white font-semibold text-gray-900 shadow-md ring-1 ring-gray-200 dark:bg-gray-600 dark:text-white dark:ring-gray-500"
              : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
          )}
          aria-label={label}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
