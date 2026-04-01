import { create } from "zustand";

interface BreedingInfo {
  petId?: string;
  name?: string;
  sex?: string;
  isPublic?: boolean;
  isBreeder?: boolean;
}

interface BreedingInfoStore {
  breedingInfo: BreedingInfo;

  setBreedingInfo: (breedingInfo: BreedingInfo) => void;
}

export const useBreedingInfoStore = create<BreedingInfoStore>((set) => ({
  breedingInfo: {},

  setBreedingInfo: (breedingInfo) => set({ breedingInfo }),
}));
