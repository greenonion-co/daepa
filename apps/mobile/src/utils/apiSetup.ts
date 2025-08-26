import { setTokenProvider } from '@repo/api-client';
import { useAuthStore } from '../store/auth';

export const setupApiClient = () => {
  const getToken = async () => useAuthStore.getState().accessToken ?? null;
  const setToken = async (token: string) =>
    useAuthStore.getState().setAccessToken(token);
  const removeToken = async () => useAuthStore.getState().setAccessToken(null);
  setTokenProvider({ setToken, getToken, removeToken });
};
