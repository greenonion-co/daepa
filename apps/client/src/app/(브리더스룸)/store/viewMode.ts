import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useIsMobile } from "@/hooks/useMobile";

export type ViewMode = "table" | "card";

interface ViewModeStore {
  viewMode: ViewMode | null;
  setViewMode: (mode: ViewMode) => void;
}

const useViewModeStore = create<ViewModeStore>()(
  persist(
    (set) => ({
      viewMode: null, // null이면 화면 크기에 따라 기본값 결정
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: "pet-view-mode",
    },
  ),
);

/**
 * viewMode 커스텀 훅
 * - 사용자가 명시적으로 설정한 값이 있으면 해당 값 사용
 * - 없으면 화면 크기에 따라 기본값 결정 (mobile: card, desktop: table)
 */
export function useViewMode() {
  const isMobile = useIsMobile();
  const { viewMode, setViewMode } = useViewModeStore();

  const effectiveViewMode: ViewMode = viewMode ?? (isMobile ? "card" : "table");

  return { viewMode: effectiveViewMode, setViewMode };
}
