import { create } from "zustand";
import { PetControllerFindAllParams } from "@repo/api-client";

export interface FilterStore<PetControllerFindAllParams> {
  searchFilters: Partial<PetControllerFindAllParams>;
  setSearchFilters: (filters: Partial<PetControllerFindAllParams>) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore<PetControllerFindAllParams>>()((set) => ({
  searchFilters: {},

  // Actions
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  resetFilters: () => set({ searchFilters: {} }),
}));
