import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { authControllerGetToken } from "..";

export const AXIOS_INSTANCE = Axios.create({
  withCredentials: true,
});

export const setAxiosInstanceBaseURL = (baseURL: string) => {
  AXIOS_INSTANCE.defaults.baseURL = baseURL;
};

// Customize query param serialization: arrays -> single key with JSON string value
AXIOS_INSTANCE.defaults.paramsSerializer = {
  serialize: (params: Record<string, unknown>) => {
    const usp = new URLSearchParams();
    if (!params) return usp.toString();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        usp.append(key, JSON.stringify(value));
        return;
      }
      usp.append(key, String(value));
    });
    return usp.toString();
  },
};

// 토큰 갱신 중복 요청 방지를 위한 플래그
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * 인증 에러 원인 — provider가 원인별로 다른 UX를 제공할 수 있도록 전달.
 * - refresh-failed: refresh token도 만료/무효 → 강제 재로그인 유도
 * - unauthorized: refresh 시도조차 못 하는 401 (다른 에러 메시지) → 동일하게 로그아웃
 * - forbidden: 403 — 권한 부족 (로그인은 유지하지만 현재 리소스 접근 불가)
 */
export type AuthErrorReason = "refresh-failed" | "unauthorized" | "forbidden";

export interface TokenProvider {
  setToken(token: string): Promise<void> | void;
  getToken(): Promise<string | null> | string | null;
  removeToken(): Promise<void> | void;
  /**
   * 인증 에러 발생 시 환경별 UX 처리 (라우팅/알림) — 필수.
   * - 웹: redirectUrl 저장 + /sign-in 이동
   * - React Native: navigation.reset → Login 화면
   * - WebView: postMessage('TOKEN_REFRESH_FAILED') 로 native에 위임
   */
  onAuthError(reason: AuthErrorReason): Promise<void> | void;
}

let tokenProvider: TokenProvider | null = null;

export const setTokenProvider = (provider: TokenProvider) => {
  tokenProvider = provider;
};

/**
 * 인증 에러를 provider에 위임. provider 는 setTokenProvider 시점에 반드시 등록돼 있어야 함.
 */
const handleAuthError = async (reason: AuthErrorReason) => {
  if (!tokenProvider) return;
  try {
    await tokenProvider.onAuthError(reason);
  } catch (e) {
    console.error("[auth] onAuthError handler 실패:", e);
  }
};

// 요청 인터셉터 추가
AXIOS_INSTANCE.interceptors.request.use(
  async (config) => {
    if (tokenProvider) {
      const token = await tokenProvider.getToken();
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      const errorMessage = error.response.data.message;

      if (errorMessage === "ACCESS_TOKEN_INVALID") {
        if (isRefreshing) {
          // 이미 토큰 갱신 중이면 큐에 추가
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return AXIOS_INSTANCE(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await authControllerGetToken();
          const newAccessToken = response.data.token;

          // 새 토큰을 저장
          if (tokenProvider) {
            await tokenProvider.setToken(newAccessToken);
          }

          // 큐에 있는 요청들 처리
          processQueue(null, newAccessToken);

          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return AXIOS_INSTANCE(originalRequest);
        } catch (refreshError) {
          // 토큰 갱신 실패 시 큐에 있는 요청들 모두 실패 처리
          processQueue(refreshError, null);

          // 로그아웃 처리 — provider가 환경별 UX를 담당
          if (tokenProvider) {
            await tokenProvider.removeToken();
            await handleAuthError("refresh-failed");
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else if (tokenProvider) {
        // ACCESS_TOKEN_INVALID가 아닌 다른 401 에러 — refresh 시도 없이 즉시 로그아웃
        await tokenProvider.removeToken();
        await handleAuthError("unauthorized");
      }
    }

    if (error.response?.status === 403) {
      await handleAuthError("forbidden");
    }

    return Promise.reject(error);
  },
);

export const useCustomInstance = <T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({ ...config, cancelToken: source.token }).then(
    (response) => response,
  );

  // @ts-ignore
  promise.cancel = () => {
    source.cancel("Query was cancelled by React Query");
  };

  return promise;
};

export default useCustomInstance;

export type ErrorType<Error> = AxiosError<Error>;
