import { create } from "zustand";
import { PetControllerFindAllParams } from "@repo/api-client";

export interface FilterStore<PetControllerFindAllParams> {
  searchFilters: Partial<PetControllerFindAllParams>;
  setSearchFilters: (
    filters:
      | Partial<PetControllerFindAllParams>
      | ((prev: Partial<PetControllerFindAllParams>) => Partial<PetControllerFindAllParams>),
  ) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore<PetControllerFindAllParams>>()((set) => ({
  searchFilters: {
    species: "CR",
  },

  // Actions
  setSearchFilters: (filters) =>
    set((state) => ({
      searchFilters: typeof filters === "function" ? filters(state.searchFilters) : filters,
    })),
  resetFilters: () =>
    set({
      searchFilters: {
        species: "CR",
      },
    }),
}));
