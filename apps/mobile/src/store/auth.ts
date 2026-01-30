import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import { UserDto, UserProfileDto } from '@repo/api-client';

// UserProfileDto를 기본으로 하고, UserDto의 추가 필드는 선택적으로 허용
type UserState = UserProfileDto | UserDto;

type AuthState = {
  accessToken: string | null;
  user: UserState | null;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserState | null) => void;
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
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Auth store hydration error:', error);
            return;
          }

          // 앱 시작 시 토큰이 없으면 user도 초기화하고 WebView 쿠키도 정리
          if (!state?.accessToken) {
            useAuthStore.setState({ user: null });
            CookieManager.clearAll().catch(console.error);
          }
        };
      },
    },
  ),
);
