import { create } from "zustand";
import {
  userControllerGetUserProfile,
  authControllerSignOut,
  UserProfileDto,
} from "@repo/api-client";
import { tokenStorage } from "@/lib/tokenStorage";
import { isNativeApp, syncUserToNative, sendToNative } from "@/lib/native-bridge";

interface UserState {
  user: UserProfileDto | null;
}

interface UserActions {
  /** 앱 시작 시 토큰 기반으로 사용자 정보 초기화 */
  initialize: () => Promise<void>;
  /** 로그인 성공 시 토큰 저장 + 사용자 정보 조회 */
  onLoginSuccess: (token: string) => Promise<void>;
  /** 로그아웃 처리 (API 호출 + 토큰 삭제 + 상태 초기화) */
  onLogout: () => Promise<void>;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()((set, get) => ({
  user: null,

  initialize: async () => {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        set({ user: null });
        return;
      }

      const { data, status } = await userControllerGetUserProfile();

      if (status !== 200) {
        throw new Error("사용자 정보를 가져오는데 실패했습니다.");
      }

      const userData = data.data;
      set({ user: userData });

      // 네이티브 앱인 경우 유저 데이터 동기화
      if (isNativeApp() && userData) {
        syncUserToNative(userData);
      }
    } catch (error) {
      console.error(error);
      set({ user: null });
    }
  },

  onLoginSuccess: async (token: string) => {
    tokenStorage.setToken(token);
    await get().initialize();
  },

  onLogout: async () => {
    try {
      await authControllerSignOut();
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error);
    } finally {
      tokenStorage.removeToken();
      set({ user: null });

      if (isNativeApp()) {
        sendToNative({ type: "LOGOUT" });
      }
    }
  },
}));
