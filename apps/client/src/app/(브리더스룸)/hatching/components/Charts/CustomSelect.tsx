"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";
import { SelectItem } from "../../../components/selector/SelectItem";

export interface CustomSelectOption {
  key: string;
  value: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  title: string;
  options: CustomSelectOption[];
  selectedKey: string;
  onChange: (key: string) => void;
  defaultOptionKey?: string;
  dropdownWidth?: string;
  disabled?: boolean;
}

const CustomSelect = ({
  title,
  options,
  selectedKey,
  onChange,
  defaultOptionKey,
  dropdownWidth = "w-[200px]",
  disabled = false,
}: CustomSelectProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"left" | "right">("right");

  const isDefault = defaultOptionKey ? selectedKey === defaultOptionKey : false;
  const selectedOption = options.find((opt) => opt.key === selectedKey);

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
    if (isOpen && containerRef.current && dropdownRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      const wouldOverflowRight = containerRect.left + dropdownRect.width > viewportWidth - 16;
      const horizontal = wouldOverflowRight ? "right" : "left";

      setDropdownPosition(horizontal);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        className={cn(
          "flex h-[32px] w-fit cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
          !isDefault
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
          disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
      >
        <div>{selectedOption?.value ?? title}</div>
        <ChevronDown
          className={cn(
            "h-4 w-4",
            !isDefault ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400",
          )}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute top-10 z-50 rounded-2xl border-[1.8px] border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800",
            "transform transition-all duration-200 ease-out",
            dropdownWidth,
            dropdownPosition === "left" ? "left-0" : "right-0",
            isEntering
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-95 opacity-0",
            isMobile && "w-48",
          )}
        >
          <div className="mb-2 font-[500] dark:text-gray-100">{title}</div>
          <div className="mb-2">
            {options.map((option) => (
              <SelectItem
                key={option.key}
                item={option}
                isSelected={selectedKey === option.key}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.key);
                    setIsOpen(false);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
