import { create } from "zustand";
import { BrAdoptionControllerGetAllAdoptionsParams, PetDto } from "@repo/api-client";
import { FilterStore } from "./filter";

interface AdoptionFilterState extends FilterStore<BrAdoptionControllerGetAllAdoptionsParams> {
  father: PetDto | null;
  mother: PetDto | null;
  setFather: (father: PetDto | null) => void;
  setMother: (mother: PetDto | null) => void;
}

export const useAdoptionFilterStore = create<AdoptionFilterState>()((set) => ({
  searchFilters: {
    species: "CR",
  },
  father: null,
  mother: null,

  // Actions
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  resetFilters: () =>
    set({
      searchFilters: {
        species: "CR",
      },
      father: null,
      mother: null,
    }),
  setFather: (father) =>
    set((state) => ({
      father,
      searchFilters: { ...state.searchFilters, fatherId: father?.petId },
    })),
  setMother: (mother) =>
    set((state) => ({
      mother,
      searchFilters: { ...state.searchFilters, motherId: mother?.petId },
    })),
}));
