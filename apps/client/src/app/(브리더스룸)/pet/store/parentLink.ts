import { create } from "zustand";
import { PetParentDto } from "@repo/api-client";
interface ParentState {
  selectedParent: PetParentDto | null;
  setSelectedParent: (parent: PetParentDto | null) => void;
}

const createParentLinkStore = () =>
  create<ParentState>((set) => ({
    selectedParent: null,

    setSelectedParent: (parent) => set({ selectedParent: parent }),
  }));

const useParentLinkStore = createParentLinkStore();

export default useParentLinkStore;
