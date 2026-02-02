/**
 * React Native WebView와 통신하기 위한 브릿지 유틸리티
 */

declare global {
  interface Window {
    isNativeApp?: boolean;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    sendToApp?: (message: NativeMessage) => void;
  }
}

// 네이티브 화면 타입 (RootStackParamList와 동기화)
type NativeScreen = "Login" | "Register" | "Tabs" | "PetDetail" | "Main" | "EmailRegister";

type ThemeMode = "light" | "dark";

type NavigateOptions = {
  replace?: boolean;
  popToTop?: boolean;
};

type NativeMessage =
  | { type: "LOGOUT" }
  | {
      type: "NAVIGATE";
      path?: string;
      screen?: NativeScreen;
      params?: object;
      options?: NavigateOptions;
    }
  | { type: "GO_BACK" }
  | { type: "POP_TO_ROOT" }
  | { type: "RESET_TO_HOME" }
  | { type: "SHARE"; url: string; title?: string }
  | { type: "OPEN_CAMERA" }
  | { type: "OPEN_GALLERY" }
  | { type: "HAPTIC"; style: "light" | "medium" | "heavy" }
  | { type: "TOKEN_REFRESH_FAILED" }
  | { type: "SET_ACCESS_TOKEN"; token: string }
  | { type: "SET_THEME"; theme: ThemeMode }
  | { type: "TOAST"; message: string; variant: "success" | "error" | "info" | "warning" }
  | { type: "SET_TOP_BAR_VISIBLE"; visible: boolean }
  | { type: "SET_PULL_TO_REFRESH"; enabled: boolean }
  | { type: "SHOW_LOADING" }
  | { type: "HIDE_LOADING" };

/**
 * 현재 환경이 네이티브 앱 WebView인지 확인
 */
export const isNativeApp = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!window.isNativeApp || !!window.ReactNativeWebView;
};

/**
 * Android 환경인지 확인
 */
export const isAndroid = (): boolean => {
  if (typeof window === "undefined") return false;
  return /android/i.test(navigator.userAgent);
};

/**
 * 네이티브 앱으로 메시지 전송
 */
export const sendToNative = (message: NativeMessage): boolean => {
  if (!isNativeApp()) return false;

  try {
    if (window.sendToApp) {
      window.sendToApp(message);
      return true;
    }
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
      return true;
    }
  } catch (error) {
    console.error("Failed to send message to native app:", error);
  }
  return false;
};

/**
 * 네이티브 공유 기능 요청
 */
export const requestShare = (url: string, title?: string): boolean => {
  return sendToNative({ type: "SHARE", url, title });
};

/**
 * 햅틱 피드백 요청
 */
export const requestHaptic = (style: "light" | "medium" | "heavy" = "light"): boolean => {
  return sendToNative({ type: "HAPTIC", style });
};

/**
 * 앱에서 전달받은 토큰 가져오기
 */
export const getAppToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

/**
 * 토큰 갱신 실패 알림 (앱에서 재인증 처리)
 */
export const notifyTokenRefreshFailed = (): boolean => {
  return sendToNative({ type: "TOKEN_REFRESH_FAILED" });
};

/**
 * 네이티브 앱에서 뒤로가기 요청
 */
export const requestGoBack = (): boolean => {
  return sendToNative({ type: "GO_BACK" });
};

/**
 * 네이티브 TopBar 표시/숨김 요청
 * @param visible - true면 표시, false면 숨김
 */
export const setTopBarVisible = (visible: boolean): boolean => {
  return sendToNative({ type: "SET_TOP_BAR_VISIBLE", visible });
};

/**
 * 네이티브 앱에 액세스 토큰 설정
 */
export const setNativeAccessToken = (token: string): boolean => {
  return sendToNative({ type: "SET_ACCESS_TOKEN", token });
};

/**
 * 네이티브 앱 홈으로 리셋 (새로 마운트)
 * 회원가입 등 토큰 동기화가 필요한 경우 사용
 */
export const requestResetToHome = (): boolean => {
  return sendToNative({ type: "RESET_TO_HOME" });
};

/**
 * 네이티브 Toast 표시 요청
 */
export const requestToast = (
  message: string,
  variant: "success" | "error" | "info" | "warning" = "info",
): boolean => {
  return sendToNative({ type: "TOAST", message, variant });
};

/**
 * 통합 네비게이션 함수
 *
 * @example
 * // WebView 페이지 이동
 * navigate({ path: '/pet/123' });
 * navigate({ path: '/home', options: { replace: true } });
 * navigate({ path: '/home', options: { popToTop: true } });
 *
 * // 네이티브 화면 이동
 * navigate({ screen: 'Login' });
 * navigate({ screen: 'PetDetail', params: { petId: '123' } });
 * navigate({ screen: 'Login', options: { replace: true } });
 */
export const navigate = (options: {
  path?: string;
  screen?: NativeScreen;
  params?: object;
  options?: NavigateOptions;
}): boolean => {
  return sendToNative({
    type: "NAVIGATE",
    path: options.path,
    screen: options.screen,
    params: options.params,
    options: options.options,
  });
};

/**
 * 네비게이션 스택을 초기화하고 루트(Tabs)로 이동
 * 등록 완료 등 플로우 종료 시 사용
 */
export const requestPopToRoot = (): boolean => {
  return sendToNative({ type: "POP_TO_ROOT" });
};

/**
 * 네이티브 앱에 테마 변경 요청
 * @param theme - 설정할 테마 ("light" | "dark")
 */
export const requestSetTheme = (theme: ThemeMode): boolean => {
  return sendToNative({ type: "SET_THEME", theme });
};

/**
 * 네이티브 앱에 Pull-to-Refresh 활성화/비활성화 요청
 * @param enabled - true면 활성화, false면 비활성화
 */
export const requestSetPullToRefresh = (enabled: boolean = true): boolean => {
  return sendToNative({ type: "SET_PULL_TO_REFRESH", enabled });
};

/**
 * 네이티브 앱 로딩 화면 표시
 */
export const showNativeLoading = (): boolean => {
  return sendToNative({ type: "SHOW_LOADING" });
};

/**
 * 네이티브 앱 로딩 화면 숨기기
 */
export const hideNativeLoading = (): boolean => {
  return sendToNative({ type: "HIDE_LOADING" });
};
