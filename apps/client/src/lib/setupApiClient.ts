import { setAxiosInstanceBaseURL, setTokenProvider } from "@repo/api-client";
import { tokenStorage } from "./tokenStorage";

// 모듈 로드 시점에 baseURL 설정
const apiBaseURL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || "http://localhost:4000";
setAxiosInstanceBaseURL(apiBaseURL);

// 클라이언트 사이드에서 모듈 로드 시점에 토큰 프로바이더 설정
if (typeof window !== "undefined") {
  setTokenProvider({
    setToken: (token: string) => tokenStorage.setToken(token),
    getToken: () => tokenStorage.getToken(),
    removeToken: () => tokenStorage.removeToken(),
  });
}

// 하위 호환성을 위해 유지 (이미 위에서 설정되므로 no-op)
export const setupApiClient = () => {
  // 이미 모듈 로드 시점에 설정됨
};
