import { create } from "zustand";
import { PetControllerFindAllParams, PetDto } from "@repo/api-client";
import { VisibilityState } from "@tanstack/react-table";

export interface FilterStore<PetControllerFindAllParams> {
  searchFilters: Partial<PetControllerFindAllParams>;
  columnFilters?: VisibilityState;
  setSearchFilters: (filters: Partial<PetControllerFindAllParams>) => void;
  setColumnFilters: (columnFilters: Partial<VisibilityState>) => void;
}

export const useFilterStore = create<FilterStore<PetControllerFindAllParams>>()((set) => ({
  searchFilters: {},
  columnFilters: undefined,

  // Actions
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  setColumnFilters: (newFilter: Partial<Record<keyof PetDto, boolean>>) =>
    set((state) => ({
      columnFilters: state.columnFilters ? { ...state.columnFilters, ...newFilter } : newFilter,
    })),
}));
