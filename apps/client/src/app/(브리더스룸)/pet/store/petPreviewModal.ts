import { PetDto } from "@repo/api-client";
import { create } from "zustand";

interface PetPreviewModalState {
  isOpen: boolean;
  pet: PetDto | null;
  petId: string | null;
}

interface PetPreviewModalActions {
  open: (pet: PetDto) => void;
  openByPetId: (petId: string) => void;
  close: () => void;
}

type PetPreviewModalStore = PetPreviewModalState & PetPreviewModalActions;

export const usePetPreviewModal = create<PetPreviewModalStore>((set) => ({
  isOpen: false,
  pet: null,
  petId: null,

  open: (pet) => set({ isOpen: true, pet, petId: pet.petId }),
  openByPetId: (petId) => set({ isOpen: true, pet: null, petId }),
  close: () => set({ isOpen: false, pet: null, petId: null }),
}));
