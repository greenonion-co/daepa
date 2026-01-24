import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserDto } from '@repo/api-client';

type AuthState = {
  accessToken: string | null;
  user: UserDto | null;
  isLoggedIn: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserDto | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accessToken: null,
      user: null,
      isLoggedIn: false,
      setAccessToken: token => set({ accessToken: token }),
      setUser: user => set({ user, isLoggedIn: !!user }),
      clear: () => set({ accessToken: null, user: null, isLoggedIn: false }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
