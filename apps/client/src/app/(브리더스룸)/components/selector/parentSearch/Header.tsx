import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PetControllerFindAllFilterType } from "@repo/api-client";
import { ChevronRight, Search } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  step: number;
  setStep: (step: number) => void;
  selectedPetName?: string;
  className?: string;
  setSearchQuery: (searchQuery: string) => void;
  searchType: PetControllerFindAllFilterType;
  setSearchType: (petListType: PetControllerFindAllFilterType) => void;
  allowMyPetOnly?: boolean;
}

const Header = ({
  step,
  setStep,
  selectedPetName,
  setSearchQuery,
  searchType,
  setSearchType,
  allowMyPetOnly = false,
  className,
}: HeaderProps) => {
  const [keyword, setKeyword] = useState("");

  return (
    <div className={cn("sticky -top-[12px] z-20 mt-3 bg-white py-4 dark:bg-[#18181B]", className)}>
      <div className="flex items-center gap-2 pb-2">
        <button
          onClick={() => step === 2 && setStep(1)}
          className={`text-[16px] font-bold ${step === 2 ? "text-gray-400 hover:text-gray-700" : ""}`}
        >
          개체 검색
        </button>
        {step === 2 && (
          <>
            <ChevronRight className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-bold">{selectedPetName}</span>
          </>
        )}
      </div>

      {step === 1 && (
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="펫 이름으로 검색하세요"
              className="h-8 rounded-lg bg-gray-100 pl-9"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchQuery(keyword);
                }
              }}
            />
          </div>
          <Button className="h-8 rounded-lg text-[14px]" onClick={() => setSearchQuery(keyword)}>
            검색
          </Button>

          <div className="flex h-[32px] w-fit items-center gap-2 rounded-lg bg-gray-100 px-1">
            <button
              onClick={() => setSearchType(PetControllerFindAllFilterType.MY)}
              className={cn(
                "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800",
                searchType === PetControllerFindAllFilterType.MY
                  ? "bg-white shadow-sm"
                  : "text-gray-600",
              )}
            >
              내 개체
            </button>
            <button
              disabled={allowMyPetOnly}
              onClick={() => setSearchType(PetControllerFindAllFilterType.NOT_MY)}
              className={cn(
                "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 disabled:cursor-not-allowed disabled:opacity-50",
                searchType === PetControllerFindAllFilterType.NOT_MY
                  ? "bg-white shadow-sm"
                  : "text-gray-600",
              )}
            >
              타인의 개체
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
