import { setTokenProvider, setAxiosInstanceBaseURL } from '@repo/api-client';
import { useAuthStore } from '../store/auth';
import Config from './config';

export const setupApiClient = () => {
  // 서버 baseURL 설정
  setAxiosInstanceBaseURL(Config.SERVER_BASE_URL);

  // 토큰 프로바이더 설정
  const getToken = async () => useAuthStore.getState().accessToken ?? null;
  const setToken = async (token: string) =>
    useAuthStore.getState().setAccessToken(token);
  const removeToken = async () => useAuthStore.getState().setAccessToken(null);
  setTokenProvider({ setToken, getToken, removeToken });

  console.log('[API] Base URL set to:', Config.SERVER_BASE_URL);
};
