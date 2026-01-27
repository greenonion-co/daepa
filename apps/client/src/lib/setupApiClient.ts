import { setAxiosInstanceBaseURL, setTokenProvider } from "@repo/api-client";
import { tokenStorage } from "./tokenStorage";

// WebView 감지 함수
const isWebView = (): boolean => {
  if (typeof window === "undefined") return false;

  // React Native WebView 감지
  const userAgent = window.navigator.userAgent.toLowerCase();
  return !!window.ReactNativeWebView || userAgent.includes("wv") || userAgent.includes("webview");
};

// 환경에 따른 API URL 결정
const getApiBaseURL = (): string => {
  // 서버 사이드에서는 환경변수 사용
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_SERVER_BASE_URL || "http://localhost:4000";
  }

  // WebView에서는 IP 주소 사용 (모바일에서 localhost 접근 불가)
  if (isWebView()) {
    return process.env.NEXT_PUBLIC_SERVER_BASE_URL || "http://localhost:4000";
  }

  // 일반 브라우저에서는 localhost 사용
  return process.env.NEXT_PUBLIC_SERVER_BASE_URL || "http://localhost:4000";
};

// 모듈 로드 시점에 baseURL 설정
const apiBaseURL = getApiBaseURL();
setAxiosInstanceBaseURL(apiBaseURL);

export const setupApiClient = () => {
  setTokenProvider({
    setToken: (token: string) => tokenStorage.setToken(token),
    getToken: () => tokenStorage.getToken(),
    removeToken: () => tokenStorage.removeToken(),
  });
};
