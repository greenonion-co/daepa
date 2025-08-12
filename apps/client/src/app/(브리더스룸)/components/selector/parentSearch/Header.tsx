import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PetSummaryDto } from "@repo/api-client";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  step: number;
  setStep: (step: number) => void;
  selectedPet?: PetSummaryDto;
  className?: string;
  setSearchQuery: (searchQuery: string) => void;
}

const Header = ({ step, setStep, selectedPet, setSearchQuery, className }: HeaderProps) => {
  const [keyword, setKeyword] = useState("");

  return (
    <div className={cn("sticky -top-[12px] z-20 mt-3 bg-white py-4 dark:bg-[#18181B]", className)}>
      <div className="flex items-center gap-2 pb-2 pl-4">
        <button
          onClick={() => step === 2 && setStep(1)}
          className={`text-lg font-bold ${step === 2 ? "text-gray-400 hover:text-gray-700" : ""}`}
        >
          부모 개체 검색
        </button>
        {step === 2 && (
          <>
            <ChevronRight className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-bold">{selectedPet?.name}</span>
          </>
        )}
      </div>

      {step === 1 && (
        <div className="flex items-center gap-2 px-2">
          <input
            type="text"
            placeholder="부모 개체를 검색하세요"
            className="w-full rounded-xl border border-gray-200 p-3 text-sm font-normal focus:border-gray-500 focus:outline-none"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchQuery(keyword);
              }
            }}
          />
          <Button className="h-12 rounded-xl text-[16px]" onClick={() => setSearchQuery(keyword)}>
            검색
          </Button>
        </div>
      )}
    </div>
  );
};

export default Header;
