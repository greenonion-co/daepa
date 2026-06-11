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
 * - refresh-failed: refresh token도 만료/무효(확실한 401/403) → 강제 재로그인 유도
 * - forbidden: 403 — 권한 부족 (로그인은 유지하지만 현재 리소스 접근 불가)
 */
export type AuthErrorReason = "refresh-failed" | "forbidden";

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

/**
 * refresh 실패가 "확실한 인증 실패"인지 판단한다.
 * - 서버가 401/403 으로 refresh token 을 명시적으로 거부한 경우만 true (→ 세션 종료).
 * - 네트워크 단절/타임아웃/5xx 등 일시적 실패는 false → 세션을 유지하고 다음 기회에 재시도.
 *   (access token 이 1h 라 refresh 가 잦은데, 일시적 실패를 로그아웃으로 처리하면
 *    refresh token 이 유효해도 며칠 안에 강제 로그아웃이 발생한다.)
 */
const isDefinitiveAuthFailure = (error: unknown): boolean => {
  if (!Axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
};

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
      const errorMessage = error.response?.data?.message;

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
          // 큐에 있는 요청들 처리
          processQueue(refreshError, null);

          // 확실한 인증 실패(refresh token 무효 = 401/403)일 때만 로그아웃한다.
          // 일시적 실패(네트워크/타임아웃/5xx)면 토큰·세션을 유지하고 다음 요청에서
          // 다시 refresh 가 시도되도록 둔다.
          if (tokenProvider && isDefinitiveAuthFailure(refreshError)) {
            await tokenProvider.removeToken();
            await handleAuthError("refresh-failed");
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      // ACCESS_TOKEN_INVALID 가 아닌 401(프록시/게이트웨이의 비표준 401 등)은
      // 세션 무효로 단정하지 않는다 — 토큰을 지우지 않고 요청만 실패시킨다.
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
