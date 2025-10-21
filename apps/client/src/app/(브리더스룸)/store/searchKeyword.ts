import { create } from "zustand";

interface SearchKeywordStore {
  searchKeyword: string;
  setSearchKeyword: (searchKeyword: string) => void;
}

export const useSearchKeywordStore = create<SearchKeywordStore>((set) => ({
  searchKeyword: "",
  setSearchKeyword: (searchKeyword) => set({ searchKeyword }),
}));
