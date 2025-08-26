import { setTokenProvider } from "@repo/api-client";
import { tokenStorage } from "./tokenStorage";

export const setupApiClient = () => {
  setTokenProvider({
    setToken: (token: string) => tokenStorage.setToken(token),
    getToken: () => tokenStorage.getToken(),
    removeToken: () => tokenStorage.removeToken(),
  });
};
