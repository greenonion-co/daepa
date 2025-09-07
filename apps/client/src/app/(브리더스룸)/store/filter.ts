import { create } from "zustand";
import { PetControllerFindAllParams, PetDto } from "@repo/api-client";
import { VisibilityState } from "@tanstack/react-table";

export interface FilterStore<P extends object, C extends string = string> {
  searchFilters: Partial<P>;
  columnFilters?: VisibilityState;
  setSearchFilters: (filters: Partial<P>) => void;
  setColumnFilters: (columnFilters: Partial<Record<C, boolean>>) => void;
}

export const useFilterStore = create<FilterStore<PetControllerFindAllParams, keyof PetDto>>()(
  (set) => ({
    searchFilters: {},
    columnFilters: undefined,

    // Actions
    setSearchFilters: (filters) => set({ searchFilters: filters }),
    setColumnFilters: (newFilter: Partial<Record<keyof PetDto, boolean>>) =>
      set((state) => ({
        columnFilters: state.columnFilters ? { ...state.columnFilters, ...newFilter } : newFilter,
      })),
  }),
);
