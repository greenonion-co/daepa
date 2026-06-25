"use client";

import { useState, useEffect, useMemo } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import { toast } from "@/lib/toast";
import { SelectableBadge } from "./SelectableBadge";

interface MultiSelectListProps {
  isOpen: boolean;
  initialValue: string[];
  displayMap: Record<string, string>;
  title?: string;
  maxSelection?: number;
  onCloseAction: () => void;
  onSelectAction: (selectedItems: string[]) => void;
  onExit: () => void;
}

export default function MultiSelectList({
  isOpen,
  initialValue,
  displayMap,
  title = "선택",
  maxSelection = 5,
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
      if (maxSelection && prev.length >= maxSelection) {
        toast.error(`최대 ${maxSelection}개까지 선택할 수 있습니다.`);
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
          <span className="text-sm text-gray-500">
            {maxSelection
              ? `${selectedItems.length}/${maxSelection} 선택됨`
              : `${selectedItems.length}개 선택됨`}
          </span>
        </div>
        <div className="flex max-h-[50dvh] flex-wrap gap-2 overflow-y-auto">
          {selectList?.map((key) => (
            <SelectableBadge
              key={key}
              label={displayMap[key] ?? key}
              selected={selectedItems.includes(key)}
              onClick={() => handleMultipleSelect(key)}
            />
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
