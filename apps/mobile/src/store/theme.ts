import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      theme: 'light',
      setTheme: theme => set({ theme }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// 테마별 색상 정의
export const themeColors = {
  light: {
    background: '#ffffff',
    tabBar: '#ffffff',
    tabBarBorder: '#e0e0e0',
    tabBarActive: '#2D3645',
    tabBarInactive: '#999999',
    statusBar: 'dark-content' as const,
  },
  dark: {
    background: '#101012',
    tabBar: '#18171C',
    tabBarBorder: '#262626', // neutral-800
    tabBarActive: '#E4E4E6',
    tabBarInactive: '#4C4D57',
    statusBar: 'light-content' as const,
  },
};
