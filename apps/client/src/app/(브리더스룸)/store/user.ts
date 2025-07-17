import { create } from "zustand";
import { userControllerGetUserProfile, UserProfileDto } from "@repo/api-client";

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
      const token = localStorage.getItem("accessToken");
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

      set({
        user: data,
      });
    } catch (error) {
      console.error(error);
    }
  },
}));
