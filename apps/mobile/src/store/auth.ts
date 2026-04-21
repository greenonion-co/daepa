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
      version: 1,
      // 향후 store shape 변경 시 사용. 현재는 v1 신규.
      migrate: (persistedState: unknown) => {
        // 현재는 마이그레이션 없음 — 미래 변경 시 여기서 분기.
        // 마이그레이션 실패 또는 알 수 없는 형태면 빈 state 반환해 강제 재로그인 유도.
        if (typeof persistedState !== 'object' || persistedState === null) {
          return { accessToken: null };
        }
        return persistedState as { accessToken: string | null };
      },
      partialize: state => ({
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            // hydration 실패 — 안전하게 logged-out 상태로 복원
            console.error('Auth store hydration error:', error);
            useAuthStore.setState({ accessToken: null, user: null });
            CookieManager.clearAll().catch(console.error);
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
