import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";

interface FilterItemProps {
  value?: string;
  placeholder: string;
  onClick: () => void;
  onClose: () => void;
}

const FilterItem = ({ value, placeholder, onClick, onClose }: FilterItemProps) => {
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
        "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 border-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[14px] font-semibold text-[#1A56B3]",
        hasValue && "bg-[#1A56B3] text-white",
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {hasValue ? value : placeholder}
      <div>
        {hasValue ? (
          <button
            type="button"
            aria-label="선택 해제"
            onClick={handleClose}
            className="flex h-4 w-4 items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </div>
  );
};

export default FilterItem;
