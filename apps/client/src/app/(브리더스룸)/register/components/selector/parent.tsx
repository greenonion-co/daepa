"use client";

import { useState } from "react";
import BottomSheet from "@/components/common/BottomSheet";

interface ParentSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
}

export default function ParentSearch({ isOpen, onClose, onSelect }: ParentSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: 실제 검색 API 연동
  const searchResults = ["부모 개체 1", "부모 개체 2", "부모 개체 3"].filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <h2 className="pl-2 text-lg font-bold">부모 개체 검색</h2>

        <div className="px-2">
          <input
            type="text"
            placeholder="부모 개체를 검색하세요"
            className="w-full rounded-xl border border-gray-200 p-3 focus:border-blue-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[60vh] min-h-[200px] overflow-y-auto">
          {searchResults.map((item) => (
            <button
              key={item}
              type="button"
              className="w-full rounded-xl p-3 text-left hover:bg-gray-100"
              onClick={() => {
                onSelect(item);
                onClose();
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
