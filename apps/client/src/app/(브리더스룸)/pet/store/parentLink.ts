import { UpdateParentRequestDtoStatus, PetDto } from "@repo/api-client";
import { create } from "zustand";

export type PetParentDtoWithMessage = PetDto & {
  message?: string;
  status?: UpdateParentRequestDtoStatus;
  isMyPet?: boolean;
};
interface ParentState {
  selectedParent: PetParentDtoWithMessage | null;
  setSelectedParent: (parent: PetParentDtoWithMessage | null) => void;
}

const createParentLinkStore = () =>
  create<ParentState>((set) => ({
    selectedParent: null,
    setSelectedParent: (parent) => set({ selectedParent: parent }),
  }));

const useParentLinkStore = createParentLinkStore();

export default useParentLinkStore;
