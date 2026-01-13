import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  onKeyDown: (value: string) => void;
}

const SearchInput = ({ placeholder, onKeyDown }: SearchInputProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder={placeholder}
          className="h-8 rounded-lg bg-gray-100 pl-8"
          enterKeyHint="search"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onKeyDown(e.currentTarget.value);
            }
          }}
          onBlur={(e) => {
            e.preventDefault();
            if (e.currentTarget.value) {
              onKeyDown(e.currentTarget.value);
            }
          }}
        />
      </div>
    </div>
  );
};

export default SearchInput;
