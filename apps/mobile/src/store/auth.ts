import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import { UserDto } from '@repo/api-client';

type AuthState = {
  accessToken: string | null;
  user: UserDto | null;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserDto | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accessToken: null,
      user: null,
      setAccessToken: token => set({ accessToken: token }),
      setUser: user => set({ user }),
      clear: () => {
        // WebView 쿠키 삭제
        CookieManager.clearAll().catch(console.error);
        set({ accessToken: null, user: null });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => {
        return state => {
          // 앱 시작 시 토큰이 없으면 WebView 쿠키도 정리
          if (!state?.accessToken) {
            CookieManager.clearAll().catch(console.error);
          }
        };
      },
    },
  ),
);
