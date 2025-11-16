"use client";

import { useState, useEffect, useMemo } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import { toast } from "sonner";

interface MultiSelectListProps {
  isOpen: boolean;
  initialValue: string[];
  displayMap: Record<string, string>;
  title?: string;
  onCloseAction: () => void;
  onSelectAction: (selectedItems: string[]) => void;
  onExit: () => void;
}

export default function MultiSelectList({
  isOpen,
  initialValue,
  displayMap,
  title = "선택",
  onCloseAction,
  onSelectAction,
  onExit,
}: MultiSelectListProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const selectList = useMemo(() => Object.keys(displayMap), [displayMap]);

  useEffect(() => {
    if (!initialValue) return;
    setSelectedItems(initialValue);
  }, [initialValue]);

  useEffect(() => {
    return () => onExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMultipleSelect = (item: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(item)) {
        return prev.filter((m) => m !== item);
      }
      if (prev.length >= 5) {
        toast.error("최대 5개까지 선택할 수 있습니다.");
        return prev;
      }
      return [...prev, item];
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSelectAction(selectedItems);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onCloseAction}
      buttonText="선택 완료"
      onClick={() => onSelectAction(selectedItems)}
    >
      <div className="space-y-4" onKeyDown={handleKeyPress}>
        <div className="flex items-center gap-2">
          <h2 className="pl-4 text-xl font-bold">{title}</h2>
          <span className="text-sm text-gray-500">{selectedItems.length}/5 선택됨</span>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {selectList?.map((key) => (
            <button
              key={key}
              className={`mb-2 mr-2 rounded-full pb-1 pl-4 pr-3 pt-1 ${
                selectedItems.includes(key) ? "bg-[#1A56B3] text-[#D9E1EC]" : "hover:bg-gray-100"
              } dark:hover:bg-gray-800`}
              onClick={() => handleMultipleSelect(key)}
            >
              {displayMap[key]}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
