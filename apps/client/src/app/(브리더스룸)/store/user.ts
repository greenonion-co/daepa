import { create } from "zustand";
import {
  userControllerGetUserProfile,
  authControllerSignOut,
  UserProfileDto,
} from "@repo/api-client";
import { tokenStorage } from "@/lib/tokenStorage";
import { isNativeApp, sendToNative } from "@/lib/native-bridge";

interface UserState {
  accessToken: string | null;
  user: UserProfileDto | null;
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

  setAccessToken: (token: string | null) => set({ accessToken: token }),

  initialize: async () => {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        set({ accessToken: null, user: null });
        return;
      }

      // 토큰을 store에 저장 (반응형 상태)
      set({ accessToken: token });

      const { data, status } = await userControllerGetUserProfile();

      if (status !== 200) {
        throw new Error("사용자 정보를 가져오는데 실패했습니다.");
      }

      const userData = data.data;
      set({ user: userData });

      // 네이티브 앱에서는 Native가 Source of Truth
      // 토큰은 Native에서 WebView로 주입됨 (injectedJavaScriptBeforeContentLoaded)
      // WebView → Native 동기화는 하지 않음
    } catch (error) {
      console.error(error);
      set({ accessToken: null, user: null });
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
