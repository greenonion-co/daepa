"use client";

import { useState, useEffect } from "react";
import BottomSheet from "@/components/common/BottomSheet";

interface MultipleSelectorProps {
  isOpen: boolean;
  initialValue: string[];
  selectList: string[];
  onCloseAction: () => void;
  onSelectAction: (selectedItems: string[]) => void;
  onExit: () => void;
}

export default function MultipleSelector({
  isOpen,
  initialValue,
  selectList,
  onCloseAction,
  onSelectAction,
  onExit,
}: MultipleSelectorProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onCloseAction}
        buttonText="선택 완료"
        onClick={() => onSelectAction(selectedItems)}
      >
        <div className="space-y-4" onKeyDown={handleKeyPress}>
          <div className="flex items-center gap-2">
            <h2 className="pl-4 text-xl font-bold">모프 선택</h2>
            <span className="text-sm text-gray-500">{selectedItems.length}/5 선택됨</span>
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            {selectList?.map((item) => (
              <button
                key={item}
                className={`mb-2 mr-2 rounded-full pb-1 pl-4 pr-3 pt-1 ${
                  selectedItems.includes(item) ? "bg-[#1A56B3] text-[#D9E1EC]" : "hover:bg-gray-100"
                } dark:hover:bg-gray-800`}
                onClick={() => handleMultipleSelect(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
