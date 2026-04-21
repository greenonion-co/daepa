const TOKEN_KEY = "accessToken";

/**
 * WebView 내부라면 native의 zustand AsyncStorage까지 토큰을 동기화.
 * 네이티브 탭 이동 시 재주입되는 토큰이 항상 최신이어야 refresh 루프를 방지할 수 있음.
 */
const syncTokenToNative = (token: string | null) => {
  if (typeof window === "undefined") return;
  const win = window as unknown as {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  };
  if (!win.ReactNativeWebView) return;
  try {
    win.ReactNativeWebView.postMessage(
      JSON.stringify({ type: "SET_ACCESS_TOKEN", token: token ?? "" }),
    );
  } catch (e) {
    console.error("[auth] native token sync 실패:", e);
  }
};

/**
 * localStorage 사용 불가 환경(WebView 일부 설정, private mode 등)에 대비한 메모리 폴백.
 * 한 번이라도 read/write가 throw하면 이후 호출에서는 메모리만 사용하여 무한 refresh 루프를 방지.
 *
 * 주의: 메모리 폴백 모드에선 페이지 새로고침/WebView 재로드 시 토큰이 사라지지만,
 * 이후 일반 인증 흐름(로그인 또는 native 주입)으로 정상화됨.
 */
let memoryToken: string | null = null;
let useMemoryFallback = false;

const safeReadStorage = (): string | null => {
  if (useMemoryFallback) return memoryToken;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.warn("[tokenStorage] localStorage read 불가, 메모리 폴백 활성:", e);
    useMemoryFallback = true;
    return memoryToken;
  }
};

const safeWriteStorage = (token: string | null): void => {
  // 메모리는 항상 갱신 (성공/실패 무관)
  memoryToken = token;
  if (useMemoryFallback) return;
  try {
    if (token === null) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (e) {
    console.warn("[tokenStorage] localStorage write 불가, 메모리 폴백 활성:", e);
    useMemoryFallback = true;
  }
};

export const tokenStorage = {
  setToken(token: string): void {
    if (!token || typeof token !== "string") {
      console.warn("Invalid token provided to setToken");
      return;
    }
    safeWriteStorage(token);
    syncTokenToNative(token);
  },

  getToken(): string | null {
    const token = safeReadStorage();
    if (!token || token === "null" || token === "undefined") {
      return null;
    }
    return token;
  },

  removeToken(): void {
    safeWriteStorage(null);
    syncTokenToNative(null);
  },

  hasToken(): boolean {
    try {
      const token = this.getToken();
      return token !== null && token.length > 0;
    } catch {
      return false;
    }
  },
};
