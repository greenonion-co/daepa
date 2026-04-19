"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  title: string;
  displayMap: Record<string, string>;
  initialValue: string[];
  maxSelection?: number;
  onClose: () => void;
  onSelect: (values: string[]) => void;
};

export default function MultiSelectPopover({
  isOpen,
  title,
  displayMap,
  initialValue,
  maxSelection,
  onClose,
  onSelect,
}: Props) {
  const [selected, setSelected] = useState<string[]>(initialValue);

  useEffect(() => {
    setSelected(initialValue);
  }, [initialValue, isOpen]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (maxSelection && prev.length >= maxSelection) return prev;
      return [...prev, key];
    });
  };

  const entries = Object.entries(displayMap);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {title}
            {maxSelection ? ` · ${selected.length}/${maxSelection}` : ` · ${selected.length}`}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto">
          {entries.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              선택 가능한 항목이 없습니다.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 p-1">
              {entries.map(([key, label]) => {
                const isSelected = selected.includes(key);
                const disabled =
                  !isSelected && maxSelection !== undefined && selected.length >= maxSelection;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(key)}
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : disabled
                          ? "cursor-not-allowed border-gray-200 text-gray-300"
                          : "border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => onSelect(selected)}>적용</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
