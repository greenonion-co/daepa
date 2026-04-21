import {
  setAxiosInstanceBaseURL,
  setTokenProvider,
  type AuthErrorReason,
} from "@repo/api-client";
import { tokenStorage } from "./tokenStorage";

// 모듈 로드 시점에 baseURL 설정
const apiBaseURL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || "http://localhost:4000";
setAxiosInstanceBaseURL(apiBaseURL);

/**
 * 웹 환경 인증 실패 처리 — 현재 URL을 redirectUrl로 저장하고 /sign-in으로 리다이렉트.
 * WebView 내부면 ReactNativeWebView.postMessage로 native에 위임.
 */
const onAuthError = (reason: AuthErrorReason) => {
  if (typeof window === "undefined") return;

  const win = window as unknown as {
    isNativeApp?: boolean;
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  };

  // WebView 내부 — native에 위임
  if (win.isNativeApp || win.ReactNativeWebView) {
    try {
      if (reason === "forbidden") {
        win.ReactNativeWebView?.postMessage(
          JSON.stringify({
            type: "TOAST",
            message: "권한이 없습니다. 관리자에게 문의해주세요.",
          }),
        );
        win.ReactNativeWebView?.postMessage(JSON.stringify({ type: "RESET_TO_HOME" }));
      } else {
        win.ReactNativeWebView?.postMessage(
          JSON.stringify({ type: "TOKEN_REFRESH_FAILED" }),
        );
      }
    } catch (e) {
      console.error("[auth] WebView postMessage 실패:", e);
    }
    return;
  }

  // 일반 웹
  if (reason === "forbidden") {
    alert("권한이 없습니다. 관리자에게 문의해주세요.");
    window.location.href = "/";
    return;
  }
  if (!window.location.pathname.startsWith("/sign-in")) {
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem("redirectUrl", currentPath);
    window.location.href = "/sign-in";
  }
};

// 클라이언트 사이드에서 모듈 로드 시점에 토큰 프로바이더 설정
if (typeof window !== "undefined") {
  setTokenProvider({
    setToken: (token: string) => tokenStorage.setToken(token),
    getToken: () => tokenStorage.getToken(),
    removeToken: () => tokenStorage.removeToken(),
    onAuthError,
  });
}

// 하위 호환성을 위해 유지 (이미 위에서 설정되므로 no-op)
export const setupApiClient = () => {
  // 이미 모듈 로드 시점에 설정됨
};
