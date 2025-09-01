import { PetDtoSpecies, PetParentDto } from "@repo/api-client";
import { create } from "zustand";

interface MatingFilterStore {
  species: PetDtoSpecies | null;
  mother: PetParentDto | null;
  father: PetParentDto | null;
  startDate?: string;
  endDate?: string;
  setSpecies: (species: PetDtoSpecies | null) => void;
  setMother: (mother: PetParentDto | null) => void;
  setFather: (father: PetParentDto | null) => void;
  setStartDate: (startDate?: string) => void;
  setEndDate: (endDate?: string) => void;
  reset: () => void;
}

export const useMatingFilterStore = create<MatingFilterStore>((set) => ({
  species: null,
  father: null,
  mother: null,

  setSpecies: (species) => set({ species }),
  setMother: (mother) => set({ mother }),
  setFather: (father) => set({ father }),
  setStartDate: (startDate) => set({ startDate }),
  setEndDate: (endDate) => set({ endDate }),
  reset: () =>
    set({ species: null, father: null, mother: null, startDate: undefined, endDate: undefined }),
}));
