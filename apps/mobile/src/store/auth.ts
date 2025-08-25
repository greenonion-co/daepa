import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Provider = 'kakao' | 'google' | 'apple' | string;

export type AuthUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
  isBiz: boolean;
  status: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  provider?: Provider[] | Provider;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accessToken: null,
      user: null,
      setAccessToken: token => set({ accessToken: token }),
      setUser: user => set({ user }),
      clear: () => set({ accessToken: null, user: null }),
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
