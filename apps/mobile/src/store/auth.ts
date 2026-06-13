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
            // hydration 실패 — logged-out 상태로 복원하되, refresh 쿠키는 지우지 않는다.
            // 쿠키는 영속 credential 이므로 일시적 hydration 오류로 파괴하면 안 된다
            // (WebView 의 startup refresh 가 이 쿠키로 세션을 복구할 수 있어야 함).
            console.error('Auth store hydration error:', error);
            useAuthStore.setState({ accessToken: null, user: null });
            return;
          }

          // access token 이 없어도 refresh 쿠키는 살아있을 수 있다 — 여기서 쿠키를
          // 지우지 않는다. 일회용 access token 의 부재로 영속 refresh 쿠키를 파괴하면
          // 유효한 세션도 강제 로그아웃된다. (명시적 로그아웃은 clear() 에서 쿠키 정리)
          if (!state?.accessToken) {
            useAuthStore.setState({ user: null });
          }
        };
      },
    },
  ),
);
