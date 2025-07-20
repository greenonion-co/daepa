"use client";

import { useEffect, useState } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import useSearchStore from "../store/search";
import { BrPetControllerFindAllParams } from "@repo/api-client";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface DetailFiltersSheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onExit: () => void;
}

const DetailFiltersSheet = ({ isOpen, onCloseAction, onExit }: DetailFiltersSheetProps) => {
  const { searchFilters, setSearchFilters } = useSearchStore();

  const [selectedFilters, setSelectedFilters] = useState<Partial<BrPetControllerFindAllParams>>({});

  useEffect(() => {
    if (!searchFilters) return;
    setSelectedFilters(searchFilters);
  }, [searchFilters]);

  useEffect(() => {
    return () => onExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMultipleSelect = (item: keyof BrPetControllerFindAllParams) => {
    setSelectedFilters((prev) => {
      return {
        ...prev,
        [item]: !prev[item],
      };
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setSearchFilters(selectedFilters);
    }
  };
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onCloseAction}
      buttonText="적용하기"
      secondButtonText="초기화"
      onSecondButtonClick={() => setSelectedFilters({})}
      onClick={() => setSearchFilters(selectedFilters)}
    >
      <div className="px-[16px]" onKeyDown={handleKeyPress}>
        <div className="max-h-[50vh] space-y-6 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <div className="text-lg font-semibold">종</div>
            <div>
              {Object.entries(SPECIES_KOREAN_INFO).map(([key, value]) => (
                <Button
                  size="lg"
                  variant="outline"
                  key={key}
                  className={cn(
                    "mb-2 mr-2 rounded-full pb-1 pl-4 pr-3 pt-1",
                    selectedFilters[key as keyof BrPetControllerFindAllParams] &&
                      "bg-[#1A56B3] text-[#D9E1EC]",
                  )}
                  onClick={() => handleMultipleSelect(key as keyof BrPetControllerFindAllParams)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-lg font-semibold">성별</div>
            <div>
              {Object.entries(GENDER_KOREAN_INFO).map(([key, value]) => (
                <Button
                  size="lg"
                  variant="outline"
                  key={key}
                  className={cn(
                    "mb-2 mr-2 rounded-full pb-1 pl-4 pr-3 pt-1",
                    selectedFilters[key as keyof BrPetControllerFindAllParams] &&
                      "bg-[#1A56B3] text-[#D9E1EC]",
                  )}
                  onClick={() => handleMultipleSelect(key as keyof BrPetControllerFindAllParams)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-lg font-semibold">공개 여부</div>
            <div>
              {Object.entries({
                true: "공개",
                false: "비공개",
              }).map(([key, value]) => (
                <Button
                  size="lg"
                  variant="outline"
                  key={key}
                  className={cn(
                    "mb-2 mr-2 rounded-full pb-1 pl-4 pr-3 pt-1",
                    selectedFilters[key as keyof BrPetControllerFindAllParams] &&
                      "bg-[#1A56B3] text-[#D9E1EC]",
                  )}
                  onClick={() => handleMultipleSelect(key as keyof BrPetControllerFindAllParams)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-lg font-semibold">몸무게 범위 (g)</div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="최소"
                value={selectedFilters.minWeight || ""}
                onChange={(e) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    minWeight: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
              <span className="flex items-center">~</span>
              <Input
                type="number"
                placeholder="최대"
                value={selectedFilters.maxWeight || ""}
                onChange={(e) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    maxWeight: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-lg font-semibold">생년월일 범위</div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="최소 (YYYYMMDD)"
                value={selectedFilters.minBirthdate || ""}
                onChange={(e) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    minBirthdate: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
              <span className="flex items-center">~</span>
              <Input
                type="number"
                placeholder="최대 (YYYYMMDD)"
                value={selectedFilters.maxBirthdate || ""}
                onChange={(e) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    maxBirthdate: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

export default DetailFiltersSheet;
