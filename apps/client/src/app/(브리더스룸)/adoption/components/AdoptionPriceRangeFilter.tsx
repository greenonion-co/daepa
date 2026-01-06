"use client";

import { useEffect, useRef, useState } from "react";
import { useAdoptionFilterStore } from "../../store/adoptionFilter";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { isNotNil } from "es-toolkit";
import { useIsMobile } from "@/hooks/useMobile";

const AdoptionPriceRangeFilter = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { searchFilters, setSearchFilters } = useAdoptionFilterStore();
  const [minPrice, setMinPrice] = useState<string>(searchFilters.minPrice?.toString() || "");
  const [maxPrice, setMaxPrice] = useState<string>(searchFilters.maxPrice?.toString() || "");

  const containerRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const root = containerRef.current;
      if (root && !root.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsEntering(false);
      const raf = requestAnimationFrame(() => setIsEntering(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setMinPrice(searchFilters.minPrice?.toString() || "");
    setMaxPrice(searchFilters.maxPrice?.toString() || "");
  }, [searchFilters]);

  const hasFilter = searchFilters.minPrice !== undefined || searchFilters.maxPrice !== undefined;

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "";
    return price.toLocaleString("ko-KR");
  };

  const displayText = () => {
    if (isNotNil(searchFilters.minPrice) && isNotNil(searchFilters.maxPrice)) {
      return `분양 가격・${formatPrice(searchFilters.minPrice)}원 ~ ${formatPrice(searchFilters.maxPrice)}원`;
    }
    if (searchFilters.minPrice) {
      return `분양 가격・${formatPrice(searchFilters.minPrice)}원 이상`;
    }
    if (searchFilters.maxPrice) {
      return `분양 가격・${formatPrice(searchFilters.maxPrice)}원 이하`;
    }
    return "분양 가격";
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(
          "flex h-[32px] cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
          hasFilter
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>{displayText()}</div>
        <ChevronDown
          className={cn(
            "h-4 w-4",
            hasFilter ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-[40px] z-50 rounded-2xl border-[1.8px] border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800",
            "origin-top transform transition-all duration-200 ease-out",
            isEntering
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-95 opacity-0",
            isMobile ? "w-[200px] p-3" : "w-[320px] p-5",
          )}
        >
          <div
            className={cn("font-[500] dark:text-gray-100", isMobile ? "mb-2 text-[13px]" : "mb-4")}
          >
            분양 가격
          </div>
          <div className={cn("flex items-center gap-2", isMobile ? "mb-2" : "mb-4")}>
            <div className="flex-1">
              <label
                className={cn(
                  "mb-1 block text-gray-600 dark:text-gray-400",
                  isMobile ? "text-[12px]" : "text-sm",
                )}
              >
                최소 가격
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setMinPrice(value);
                    }
                  }}
                  placeholder="0"
                  className={cn(
                    "w-full appearance-none rounded-lg border border-gray-200 bg-white pl-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                    isMobile ? "h-[28px] pr-5 text-[12px]" : "h-[32px] pr-7 text-sm",
                  )}
                />
                <span
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400",
                    isMobile ? "text-[12px]" : "text-sm",
                  )}
                >
                  원
                </span>
              </div>
            </div>
            <div className={cn("text-gray-400 dark:text-gray-500", isMobile ? "mt-4" : "mt-6")}>
              ~
            </div>
            <div className="flex-1">
              <label
                className={cn(
                  "mb-1 block text-gray-600 dark:text-gray-400",
                  isMobile ? "text-[12px]" : "text-sm",
                )}
              >
                최대 가격
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setMaxPrice(value);
                    }
                  }}
                  placeholder="무제한"
                  className={cn(
                    "w-full appearance-none rounded-lg border border-gray-200 bg-white pl-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                    isMobile ? "h-[28px] pr-5 text-[12px]" : "h-[32px] pr-7 text-sm",
                  )}
                />
                <span
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400",
                    isMobile ? "text-[12px]" : "text-sm",
                  )}
                >
                  원
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
                setSearchFilters({
                  ...searchFilters,
                  minPrice: undefined,
                  maxPrice: undefined,
                });
              }}
              className={cn(
                "cursor-pointer rounded-lg bg-gray-100 font-semibold text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
                isMobile ? "h-[28px] px-2 text-[12px]" : "h-[32px] px-3 text-sm",
              )}
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchFilters({
                  ...searchFilters,
                  minPrice: minPrice ? Number(minPrice) : undefined,
                  maxPrice: maxPrice ? Number(maxPrice) : undefined,
                });
                setIsOpen(false);
              }}
              className={cn(
                "cursor-pointer rounded-lg bg-blue-500 font-semibold text-white hover:bg-blue-600",
                isMobile ? "h-[28px] px-2 text-[12px]" : "h-[32px] px-3 text-sm",
              )}
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdoptionPriceRangeFilter;
