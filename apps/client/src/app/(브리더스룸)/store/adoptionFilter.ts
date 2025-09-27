import { create } from "zustand";
import { AdoptionControllerGetAllAdoptionsParams, PetDto } from "@repo/api-client";
import { FilterStore } from "./filter";

export const useAdoptionFilterStore = create<
  FilterStore<AdoptionControllerGetAllAdoptionsParams>
>()((set) => ({
  searchFilters: {},
  columnFilters: {},

  // Actions
  setSearchFilters: (filters) => set({ searchFilters: filters }),

  setColumnFilters: (newFilter: Partial<Record<keyof PetDto, boolean>>) =>
    set((state) => ({
      columnFilters: state.columnFilters ? { ...state.columnFilters, ...newFilter } : newFilter,
    })),
}));
