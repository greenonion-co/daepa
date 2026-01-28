import { create } from 'zustand';

interface NavigationStore {
  // 스크롤 투 탑 트리거 (timestamp로 변경 감지)
  scrollToTopTrigger: Record<string, number>;
  triggerScrollToTop: (routeName: string) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  scrollToTopTrigger: {},
  triggerScrollToTop: (routeName: string) =>
    set((state) => ({
      scrollToTopTrigger: {
        ...state.scrollToTopTrigger,
        [routeName]: Date.now(),
      },
    })),
}));
