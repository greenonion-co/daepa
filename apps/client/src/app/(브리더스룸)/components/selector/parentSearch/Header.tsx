import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/useMobile";
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
  const isMobile = useIsMobile();
  const [keyword, setKeyword] = useState("");

  return (
    <div className={cn("dark:bg-background sticky -top-[12px] z-20 mt-3 bg-white py-4", className)}>
      <div className="flex items-center gap-2 pb-2">
        <button
          onClick={() => step === 2 && setStep(1)}
          className={`text-[16px] font-bold ${step === 2 ? "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300" : "dark:text-gray-100"}`}
        >
          개체 검색
          {step === 1 && allowMyPetOnly && (
            <span className="ml-1 text-xs font-[500] text-red-600 dark:text-red-400">
              * 나의 펫만 선택 가능합니다.
            </span>
          )}
        </button>
        {step === 2 && (
          <>
            <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="text-lg font-bold dark:text-gray-100">{selectedPetName}</span>
          </>
        )}
      </div>

      {step === 1 && (
        <div className={cn("flex items-center gap-2", isMobile && "flex-col items-start")}>
          <div className="flex gap-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="펫 이름으로 검색하세요"
                className="h-8 rounded-lg bg-gray-100 pl-9 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchQuery(keyword);
                  }
                }}
              />
            </div>
            <Button
              className="h-8 rounded-lg text-[14px] dark:bg-neutral-800 dark:text-neutral-300"
              onClick={() => setSearchQuery(keyword)}
            >
              검색
            </Button>
          </div>

          {!allowMyPetOnly && (
            <div className="flex h-[32px] w-fit items-center gap-2 rounded-lg bg-gray-100 px-1 dark:bg-gray-800">
              <button
                onClick={() => setSearchType(PetControllerFindAllFilterType.MY)}
                className={cn(
                  "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200",
                  searchType === PetControllerFindAllFilterType.MY
                    ? "bg-white shadow-sm dark:bg-gray-700"
                    : "text-gray-600 dark:text-gray-400",
                  isMobile && "text-xs",
                )}
              >
                내 개체
              </button>
              <button
                onClick={() => setSearchType(PetControllerFindAllFilterType.NOT_MY)}
                className={cn(
                  "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200",
                  searchType === PetControllerFindAllFilterType.NOT_MY
                    ? "bg-white shadow-sm dark:bg-gray-700"
                    : "text-gray-600 dark:text-gray-400",
                  isMobile && "text-xs",
                )}
              >
                타인의 개체
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Header;
