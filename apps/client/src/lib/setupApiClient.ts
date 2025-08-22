import { setTokenProvider } from "../../../../packages/api-client/src/api/mutator/use-custom-instance";
import { tokenStorage } from "./tokenStorage";

export const setupApiClient = () => {
  setTokenProvider({
    setToken: (token: string) => tokenStorage.setToken(token),
    getToken: () => tokenStorage.getToken(),
    removeToken: () => tokenStorage.removeToken(),
  });
};
