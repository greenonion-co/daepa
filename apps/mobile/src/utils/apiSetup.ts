import { setTokenProvider } from '@repo/api-client';
import { useAuthStore } from '../store/auth';

// TODO!: 환경에 따라 baseURL 설정

export const setupApiClient = () => {
  const getToken = async () => useAuthStore.getState().accessToken ?? null;
  const setToken = async (token: string) =>
    useAuthStore.getState().setAccessToken(token);
  const removeToken = async () => useAuthStore.getState().setAccessToken(null);
  setTokenProvider({ setToken, getToken, removeToken });
};
