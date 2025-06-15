import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

export const AXIOS_INSTANCE = Axios.create({ baseURL: "http://localhost:4000" });

// 요청 인터셉터 추가
AXIOS_INSTANCE.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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
