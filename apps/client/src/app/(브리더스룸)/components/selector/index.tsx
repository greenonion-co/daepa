"use client";

import BottomSheet from "@/components/common/BottomSheet";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import { useEffect, useState } from "react";
import { PetDtoSpecies } from "@repo/api-client";
import { PetDtoSex } from "@repo/api-client";

interface SelectorProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSelectAction: (value: string) => void;
  title?: string;
  currentValue?: string;
  selectList: string[];
  type?: string;
  onExit: () => void;
}

const SelectButton = ({
  item,
  isSelected,
  onClick,
  type,
}: {
  item: string;
  isSelected: boolean;
  onClick: () => void;
  type?: string;
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
    {type === "sex"
      ? GENDER_KOREAN_INFO[item as PetDtoSex]
      : type === "species"
        ? SPECIES_KOREAN_INFO[item as PetDtoSpecies]
        : item}
  </button>
);

export default function Selector({
  isOpen,
  onCloseAction,
  onSelectAction,
  title,
  currentValue,
  selectList,
  type,
  onExit,
}: SelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(
    currentValue ? selectList.indexOf(currentValue) : 0,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : selectList.length - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < selectList.length - 1 ? prev + 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (selectList[selectedIndex]) {
            onSelectAction(selectList[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, selectList, selectedIndex, onSelectAction]);

  useEffect(() => {
    return () => onExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BottomSheet isOpen={isOpen} onClose={onCloseAction}>
      <div className="space-y-4">
        {title && <h2 className="pl-4 text-xl font-bold">{title}</h2>}
        <div className="flex max-h-[60vh] min-h-[200px] flex-col gap-1 overflow-y-auto">
          {selectList.map((item, index) => (
            <SelectButton
              key={item}
              item={item}
              isSelected={selectedIndex === index}
              onClick={() => onSelectAction(item)}
              type={type}
            />
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
