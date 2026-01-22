import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  value?: string;
  onKeyDown: (value: string) => void;
}

const SearchInput = ({ placeholder, value: externalValue = "", onKeyDown }: SearchInputProps) => {
  const [inputValue, setInputValue] = useState(externalValue);

  // 외부 value가 변경되면 내부 상태 동기화
  useEffect(() => {
    setInputValue(externalValue);
  }, [externalValue]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="h-8 rounded-lg bg-gray-100 pl-8"
          enterKeyHint="search"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onKeyDown(inputValue);
            }
          }}
          onBlur={() => {
            if (inputValue) {
              onKeyDown(inputValue);
            }
          }}
        />
      </div>
    </div>
  );
};

export default SearchInput;
