import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SelectItemProps {
  item: {
    key: string | null;
    value: string;
    disabled?: boolean;
  };
  isSelected: boolean;
  onClick: (key: string | null) => void;
}

export const SelectItem = ({ item, isSelected, onClick }: SelectItemProps) => {
  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-center justify-between rounded-xl px-2 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
        isSelected && "text-blue-700 dark:text-blue-400",
        item.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
      onClick={() => !item.disabled && onClick(item.key)}
      disabled={item.disabled}
    >
      {item.value}
      {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
    </button>
  );
};
