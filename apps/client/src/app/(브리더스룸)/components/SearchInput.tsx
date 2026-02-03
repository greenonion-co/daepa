import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

const SearchInput = ({
  placeholder,
  value: externalValue = "",
  onChange,
  debounceMs = 300,
}: SearchInputProps) => {
  const [inputValue, setInputValue] = useState(externalValue);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 외부 value가 변경되면 내부 상태 동기화
  useEffect(() => {
    setInputValue(externalValue);
  }, [externalValue]);

  // debounce된 검색 실행
  useEffect(() => {
    // 초기 마운트 시에는 실행하지 않음 (외부 값과 동일한 경우)
    if (inputValue === externalValue) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(inputValue);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, onChange, debounceMs, externalValue]);

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
        />
      </div>
    </div>
  );
};

export default SearchInput;
