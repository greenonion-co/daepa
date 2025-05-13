"use client";

import { useState, useEffect } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import { MORPH_LIST_BY_SPECIES } from "../../../constants";
import { useFormStore } from "../../store/form";

interface MorphSelectorProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSelectAction: (morphs: string[]) => void;
}

export default function MorphSelector({
  isOpen,
  onCloseAction,
  onSelectAction,
}: MorphSelectorProps) {
  const { formData } = useFormStore();
  const [selectedMorphs, setSelectedMorphs] = useState<string[]>(formData.morph || []);
  const species = formData.species as string;

  useEffect(() => {
    setSelectedMorphs([]);
  }, [species]);

  const handleMorphSelect = (morph: string) => {
    setSelectedMorphs((prev) => {
      if (prev.includes(morph)) {
        return prev.filter((m) => m !== morph);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, morph];
    });
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onCloseAction}
        buttonText="선택 완료"
        onClick={() => onSelectAction(selectedMorphs)}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="pl-4 text-xl font-bold">모프 선택</h2>
            <span className="text-sm text-gray-500">{selectedMorphs.length}/5 선택됨</span>
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            {MORPH_LIST_BY_SPECIES[species]?.map((morph) => (
              <button
                key={morph}
                className={`mb-2 mr-2 rounded-full pb-1 pl-4 pr-3 pt-1 ${
                  selectedMorphs.includes(morph)
                    ? "bg-[#1A56B3] text-[#D9E1EC]"
                    : "hover:bg-gray-100"
                } dark:hover:bg-gray-800`}
                onClick={() => handleMorphSelect(morph)}
              >
                {morph}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
