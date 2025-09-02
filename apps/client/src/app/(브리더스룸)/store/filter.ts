import { create } from "zustand";
import { BrPetControllerFindAllParams, PetDto } from "@repo/api-client";
import { VisibilityState } from "@tanstack/react-table";

export interface FilterStore {
  searchFilters: Partial<BrPetControllerFindAllParams>;
  columnFilters?: VisibilityState;
  setSearchFilters: (filters: Partial<BrPetControllerFindAllParams>) => void;
  setColumnFilters: (columnFilters: Partial<Record<keyof PetDto, boolean>>) => void;
  clearSearchFilters?: () => void;
  clearColumnFilters?: () => void;
}

export const useFilterStore = create<FilterStore>()((set) => ({
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
