import { create } from "zustand";

export type SearchFilters = Record<string, string[] | string | number | undefined>;

interface SearchState {
  searchFilters: Partial<SearchFilters>;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
}

const createSearchStore = () =>
  create<SearchState>((set) => ({
    searchFilters: {},
    setSearchFilters: (filters) => set({ searchFilters: filters }),
  }));

const useSearchStore = createSearchStore();

export default useSearchStore;
