import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";

interface FilterItemProps {
  value?: string;
  placeholder: string;
  onClick: () => void;
  onClose: () => void;
}

const FilterItem = ({ value, placeholder, onClick, onClose }: FilterItemProps) => {
  return (
    <div
      className={cn(
        "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 border-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[14px] font-semibold text-[#1A56B3]",
        value && "bg-[#1A56B3] text-white",
      )}
      onClick={onClick}
    >
      {value ?? placeholder}
      <div>
        {value ? (
          <X
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="h-4 w-4"
          />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </div>
  );
};

export default FilterItem;
