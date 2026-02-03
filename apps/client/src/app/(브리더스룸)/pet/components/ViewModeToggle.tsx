"use client";

import { LayoutGrid, Table } from "lucide-react";
import { cn } from "@/lib/utils";
import { useViewMode, ViewMode } from "../../store/viewMode";

export default function ViewModeToggle() {
  const { viewMode, setViewMode } = useViewMode();

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
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
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
