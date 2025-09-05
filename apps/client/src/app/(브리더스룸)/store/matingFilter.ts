import { CreateMatingDtoEggStatus, PetDtoSpecies, PetParentDto } from "@repo/api-client";
import { create } from "zustand";

interface MatingFilterStore {
  species: PetDtoSpecies | null;
  mother: PetParentDto | null;
  father: PetParentDto | null;
  startDate?: string;
  endDate?: string;
  eggStatus: CreateMatingDtoEggStatus | null;
  setSpecies: (species: PetDtoSpecies | null) => void;
  setMother: (mother: PetParentDto | null) => void;
  setFather: (father: PetParentDto | null) => void;
  setStartDate: (startDate?: string) => void;
  setEndDate: (endDate?: string) => void;
  setEggStatus: (eggStatus: CreateMatingDtoEggStatus | null) => void;
  reset: () => void;
}

export const useMatingFilterStore = create<MatingFilterStore>((set) => ({
  species: null,
  father: null,
  mother: null,
  eggStatus: null,

  setSpecies: (species) => set({ species }),
  setMother: (mother) => set({ mother }),
  setFather: (father) => set({ father }),
  setStartDate: (startDate) => set({ startDate }),
  setEndDate: (endDate) => set({ endDate }),
  setEggStatus: (eggStatus) => set({ eggStatus }),
  reset: () =>
    set({ species: null, father: null, mother: null, startDate: undefined, endDate: undefined }),
}));
