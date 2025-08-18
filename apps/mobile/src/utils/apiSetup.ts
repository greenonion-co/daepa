import { setTokenProvider } from '@repo/api-client';
import { tokenStorage } from './tokenStorage';

export const setupApiClient = () => {
  setTokenProvider({
    setToken: async (token: string) => await tokenStorage.setToken(token),
    getToken: async () => await tokenStorage.getToken(),
    removeToken: async () => await tokenStorage.removeToken(),
  });
};
