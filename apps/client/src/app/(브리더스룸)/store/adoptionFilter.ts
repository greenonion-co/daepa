import { create } from "zustand";
import { PetDto } from "@repo/api-client";
import { FilterStore } from "./filter";

export const useAdoptionFilterStore = create<FilterStore>()((set) => ({
  searchFilters: {},
  columnFilters: undefined,

  // Actions
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  clearSearchFilters: () => set({ searchFilters: {} }),

  setColumnFilters: (newFilter: Partial<Record<keyof PetDto, boolean>>) =>
    set((state) => ({
      columnFilters: state.columnFilters ? { ...state.columnFilters, ...newFilter } : newFilter,
    })),
  clearColumnFilters: () => set({ columnFilters: undefined }),
}));
