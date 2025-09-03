import { create } from "zustand";

import { DUPLICATE_CHECK_STATUS } from "../register/types";

interface nameStore {
  duplicateCheckStatus: DUPLICATE_CHECK_STATUS;

  setDuplicateCheckStatus: (duplicateCheckStatus: DUPLICATE_CHECK_STATUS) => void;
}

export const useNameStore = create<nameStore>()((set) => ({
  duplicateCheckStatus: DUPLICATE_CHECK_STATUS.NONE,
  setDuplicateCheckStatus: (duplicateCheckStatus) => set({ duplicateCheckStatus }),
}));
