import { useEffect, useRef } from "react";
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
  /**
   * 스크롤 영역 내에서 해당 항목으로 자동 스크롤할지 여부
   * - 미지정: isSelected 값을 따름 (SingleSelect용)
   * - true: 스크롤 실행
   * - false: 스크롤 안 함 (MultiSelect에서 첫 번째 선택 항목 외에 사용)
   */
  autoScroll?: boolean;
}

export const SelectItem = ({ item, isSelected, onClick, autoScroll }: SelectItemProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shouldScroll = autoScroll ?? isSelected;

  useEffect(() => {
    if (shouldScroll && buttonRef.current) {
      buttonRef.current.scrollIntoView({ block: "center" });
    }
  }, [shouldScroll]);

  return (
    <button
      ref={buttonRef}
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
