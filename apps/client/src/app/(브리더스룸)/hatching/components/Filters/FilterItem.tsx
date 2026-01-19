import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface FilterItemProps {
  value?: string;
  placeholder: string;
  disabled?: boolean;
  variant?: "default" | "light";
  onClick: () => void;
  onClose: () => void;
}

const FilterItem = ({
  value,
  placeholder,
  disabled = false,
  variant = "default",
  onClick,
  onClose,
}: FilterItemProps) => {
  const isLight = variant === "light";
  const hasValue = Boolean(value?.trim());

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex h-[32px] cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
        hasValue
          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
          : isLight
            ? "bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-200"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        disabled && "cursor-not-allowed opacity-50",
      )}
      onClick={() => !disabled && onClick()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {hasValue ? value : placeholder}
      <div>
        {hasValue && (
          <button
            type="button"
            aria-label="선택 해제"
            onClick={handleClose}
            className="flex h-4 w-4 items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterItem;
