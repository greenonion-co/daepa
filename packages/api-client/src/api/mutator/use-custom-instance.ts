import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { authControllerGetToken } from "..";

export const AXIOS_INSTANCE = Axios.create({
  baseURL: "http://localhost:4000",
  withCredentials: true,
});

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

export interface TokenProvider {
  setToken(token: string): Promise<void> | void;
  getToken(): Promise<string | null> | string | null;
  removeToken(): Promise<void> | void;
}

let tokenProvider: TokenProvider | null = null;

export const setTokenProvider = (provider: TokenProvider) => {
  tokenProvider = provider;
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

          // 로그아웃 처리
          if (tokenProvider) {
            await tokenProvider.removeToken();
            if (typeof window !== "undefined" && window?.location?.pathname) {
              const currentPath = window.location.pathname + window.location.search;
              localStorage.setItem("redirectUrl", currentPath);
              window.location.href = "/sign-in";
            }
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // ACCESS_TOKEN_INVALID가 아닌 다른 401 에러
      if (tokenProvider) {
        tokenProvider.removeToken();
        if (typeof window !== "undefined" && window?.location?.pathname) {
          const currentPath = window.location.pathname + window.location.search;
          localStorage.setItem("redirectUrl", currentPath);
          window.location.href = "/sign-in";
        }
      }
    }

    if (error.response?.status === 403) {
      if (typeof window !== "undefined") {
        alert("권한이 없습니다. 관리자에게 문의해주세요.");
        window.location.href = "/";
      }
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
