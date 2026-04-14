import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useIsMobile } from "@/hooks/useMobile";

export type ViewMode = "table" | "card";
export type ViewModeKey = "pet" | "adoption";

interface ViewModeStore {
  modes: Record<string, ViewMode | null>;
  setViewMode: (key: ViewModeKey, mode: ViewMode) => void;
}

const useViewModeStore = create<ViewModeStore>()(
  persist(
    (set) => ({
      modes: {},
      setViewMode: (key, mode) =>
        set((state) => ({ modes: { ...state.modes, [key]: mode } })),
    }),
    {
      name: "view-mode",
    },
  ),
);

/**
 * viewMode 커스텀 훅
 * - key로 페이지별 독립적인 뷰모드를 관리
 * - 사용자가 명시적으로 설정한 값이 있으면 해당 값 사용
 * - 없으면 화면 크기에 따라 기본값 결정 (mobile: card, desktop: table)
 */
export function useViewMode(key: ViewModeKey = "pet") {
  const isMobile = useIsMobile();
  const modes = useViewModeStore((s) => s.modes);
  const setViewModeStore = useViewModeStore((s) => s.setViewMode);

  const effectiveViewMode: ViewMode = modes[key] ?? (isMobile ? "card" : "table");

  return {
    viewMode: effectiveViewMode,
    setViewMode: (mode: ViewMode) => setViewModeStore(key, mode),
  };
}
