import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "table" | "card";

interface ViewModeStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useViewModeStore = create<ViewModeStore>()(
  persist(
    (set) => ({
      viewMode: "table",
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: "pet-view-mode",
    },
  ),
);
