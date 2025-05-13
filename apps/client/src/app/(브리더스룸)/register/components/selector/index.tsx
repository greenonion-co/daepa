"use client";

import BottomSheet from "@/components/common/BottomSheet";

interface SelectorProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSelectAction: (value: string) => void;
  title?: string;
  currentValue?: string;
  selectList: string[];
}

const SelectButton = ({
  item,
  isSelected,
  onClick,
}: {
  item: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={`w-full cursor-pointer rounded-2xl px-4 py-2 text-left text-lg outline-none transition-colors focus:outline-none focus:ring-0 dark:hover:bg-gray-800 ${
      isSelected
        ? "bg-[#247DFE] font-semibold text-white hover:bg-blue-600"
        : "hover:bg-gray-100 focus:bg-gray-100"
    } `}
    onClick={onClick}
  >
    {item}
  </button>
);

export default function Selector({
  isOpen,
  onCloseAction,
  onSelectAction,
  title,
  currentValue,
  selectList,
}: SelectorProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onCloseAction}>
      <div className="space-y-4">
        {title && <h2 className="pl-4 text-xl font-bold">{title}</h2>}
        <div className="flex max-h-[60vh] min-h-[200px] flex-col gap-1 overflow-y-auto">
          {selectList.map((item) => (
            <SelectButton
              key={item}
              item={item}
              isSelected={currentValue === item}
              onClick={() => onSelectAction(item)}
            />
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
