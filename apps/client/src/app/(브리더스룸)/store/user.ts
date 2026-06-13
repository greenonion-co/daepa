import { create } from "zustand";
import {
  userControllerGetUserProfile,
  authControllerSignOut,
  authControllerGetToken,
  UserProfileDto,
} from "@repo/api-client";
import { tokenStorage } from "@/lib/tokenStorage";
import { isNativeApp, sendToNative } from "@/lib/native-bridge";

interface UserState {
  accessToken: string | null;
  user: UserProfileDto | null;
  isInitialized: boolean;
}

interface UserActions {
  /** 앱 시작 시 토큰 기반으로 사용자 정보 초기화 */
  initialize: () => Promise<void>;
  /** 로그인 성공 시 토큰 저장 + 사용자 정보 조회 */
  onLoginSuccess: (token: string) => Promise<void>;
  /** 로그아웃 처리 (API 호출 + 토큰 삭제 + 상태 초기화) */
  onLogout: () => Promise<void>;
  /** 토큰 설정 */
  setAccessToken: (token: string | null) => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()((set, get) => ({
  accessToken: null,
  user: null,
  isInitialized: false,

  setAccessToken: (token: string | null) => set({ accessToken: token }),

  initialize: async () => {
    set({ isInitialized: false });
    try {
      let token = tokenStorage.getToken();
      if (!token) {
        // sign-in 페이지에서는 세션 복구를 시도하지 않는다.
        // (로그인 화면에서 유효 쿠키로 자동 재로그인되는 것을 방지)
        const onSignInPage =
          typeof window !== "undefined" &&
          window.location.pathname.startsWith("/sign-in");
        if (onSignInPage) {
          set({ accessToken: null, user: null, isInitialized: true });
          return;
        }

        // access token 이 없어도 refresh 쿠키가 살아있으면 세션을 복구할 수 있다.
        // 로그아웃으로 단정하기 전에 1회 refresh 를 시도한다 (며칠 뒤 로그아웃 방지).
        try {
          const { data } = await authControllerGetToken();
          token = data.token;
          tokenStorage.setToken(token);
        } catch {
          set({ accessToken: null, user: null, isInitialized: true });
          return;
        }
      }

      // 토큰을 store에 저장 (반응형 상태)
      set({ accessToken: token });

      const { data, status } = await userControllerGetUserProfile();

      if (status !== 200) {
        throw new Error("사용자 정보를 가져오는데 실패했습니다.");
      }

      const userData = data.data;
      set({ user: userData, isInitialized: true });

      // 네이티브 앱에서는 Native가 Source of Truth
      // 토큰은 Native에서 WebView로 주입됨 (injectedJavaScriptBeforeContentLoaded)
      // WebView → Native 동기화는 하지 않음
    } catch (error) {
      console.error(error);
      set({ accessToken: null, user: null, isInitialized: true });
    }
  },

  onLoginSuccess: async (token: string) => {
    tokenStorage.setToken(token);
    set({ accessToken: token });
    await get().initialize();
  },

  onLogout: async () => {
    try {
      await authControllerSignOut();
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error);
    } finally {
      tokenStorage.removeToken();
      set({ accessToken: null, user: null });

      if (isNativeApp()) {
        sendToNative({ type: "LOGOUT" });
      }
    }
  },
}));
