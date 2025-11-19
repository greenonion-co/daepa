"use client";

import { useEffect, useRef, useState } from "react";
import { useAdoptionFilterStore } from "../../store/adoptionFilter";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const AdoptionPriceRangeFilter = () => {
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
    if (searchFilters.minPrice && searchFilters.maxPrice) {
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
          hasFilter ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-800",
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>{displayText()}</div>
        <ChevronDown className={cn("h-4 w-4", hasFilter ? "text-blue-600" : "text-gray-600")} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-[40px] z-50 w-[320px] rounded-2xl border-[1.8px] border-gray-200 bg-white p-5 shadow-lg",
            "origin-top transform transition-all duration-200 ease-out",
            isEntering
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-95 opacity-0",
          )}
        >
          <div className="mb-4 font-[500]">분양 가격</div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-gray-600">최소 가격</label>
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
                  className="h-[32px] w-full rounded-lg border border-gray-200 px-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  원
                </span>
              </div>
            </div>
            <div className="mt-6 text-gray-400">~</div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-gray-600">최대 가격</label>
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
                  className="h-[32px] w-full rounded-lg border border-gray-200 px-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">
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
              className="h-[32px] cursor-pointer rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200"
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
              className="h-[32px] cursor-pointer rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600"
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
