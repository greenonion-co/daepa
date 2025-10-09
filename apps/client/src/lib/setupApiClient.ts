import { setAxiosInstanceBaseURL, setTokenProvider } from "@repo/api-client";
import { tokenStorage } from "./tokenStorage";

// 모듈 로드 시점에 baseURL 설정
const apiBaseURL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || "http://localhost:4000";
setAxiosInstanceBaseURL(apiBaseURL);

export const setupApiClient = () => {
  setTokenProvider({
    setToken: (token: string) => tokenStorage.setToken(token),
    getToken: () => tokenStorage.getToken(),
    removeToken: () => tokenStorage.removeToken(),
  });
};
