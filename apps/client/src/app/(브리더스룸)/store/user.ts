import { create } from "zustand";
import { userControllerGetUserProfile, UserProfileDto } from "@repo/api-client";
import { tokenStorage } from "@/lib/tokenStorage";
import { isNativeApp, syncUserToNative } from "@/lib/native-bridge";

interface UserState {
  user: UserProfileDto | null;
}

interface UserActions {
  setUser: (user: UserProfileDto) => void;
  clearUser: () => void;
  initialize: () => Promise<void>;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()((set) => ({
  user: null,

  // Actions
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),

  // 초기화 함수
  initialize: async () => {
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        set({
          user: null,
        });
        return;
      }

      const { data, status } = await userControllerGetUserProfile();

      if (status !== 200) {
        throw new Error("사용자 정보를 가져오는데 실패했습니다.");
      }

      const userData = data.data;

      set({
        user: userData,
      });

      // 네이티브 앱인 경우 유저 데이터 동기화
      if (isNativeApp() && userData) {
        syncUserToNative(userData);
      }
    } catch (error) {
      console.error(error);
    }
  },
}));
