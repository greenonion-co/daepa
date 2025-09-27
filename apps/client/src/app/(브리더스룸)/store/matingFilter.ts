import { EggDetailDtoStatus, PetDto, PetDtoSpecies } from "@repo/api-client";
import { create } from "zustand";

interface MatingFilterStore {
  species: PetDtoSpecies | null;
  mother: PetDto | null;
  father: PetDto | null;
  eggStatus: EggDetailDtoStatus | null;
  startDate?: string;
  endDate?: string;
  setSpecies: (species: PetDtoSpecies | null) => void;
  setMother: (mother: PetDto | null) => void;
  setFather: (father: PetDto | null) => void;
  setEggStatus: (eggStatus: EggDetailDtoStatus | null) => void;
  setStartDate: (startDate?: string) => void;
  setEndDate: (endDate?: string) => void;
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
  setEggStatus: (eggStatus) => set({ eggStatus }),
  setStartDate: (startDate) => set({ startDate }),
  setEndDate: (endDate) => set({ endDate }),
  reset: () =>
    set({
      species: null,
      father: null,
      mother: null,
      startDate: undefined,
      endDate: undefined,
      eggStatus: null,
    }),
}));
