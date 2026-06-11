import {
  AXIOS_INSTANCE,
  setAxiosInstanceBaseURL,
  setTokenProvider,
  type AuthErrorReason,
} from '@repo/api-client';
import CookieManager from '@react-native-cookies/cookies';
import Toast from '@/components/common/Toast';
import { useAuthStore } from '../store/auth';
import { resetToLogin } from '../navigation/navigationRef';
import Config from './config';

export const setupApiClient = () => {
  // 서버 baseURL 설정
  setAxiosInstanceBaseURL(Config.SERVER_BASE_URL);

  // 토큰 프로바이더 설정
  const getToken = async () => useAuthStore.getState().accessToken ?? null;
  const setToken = async (token: string) =>
    useAuthStore.getState().setAccessToken(token);
  const removeToken = async () => useAuthStore.getState().setAccessToken(null);

  /**
   * axios 인터셉터가 인증 실패 시 호출 — native 환경 전용 처리.
   * refresh 실패/401: 로컬 상태 정리 + Login 화면으로 reset.
   * 403: 권한 없음 toast + 홈으로 이동 (WebView의 RESET_TO_HOME과 동일 UX).
   */
  const onAuthError = async (reason: AuthErrorReason) => {
    if (reason === 'forbidden') {
      Toast.show('권한이 없습니다. 관리자에게 문의해주세요.');
      return;
    }
    // refresh-failed: 세션 종료
    useAuthStore.getState().clear();
    resetToLogin();
  };

  setTokenProvider({ setToken, getToken, removeToken, onAuthError });

  // Native cookie store ↔ axios 연결
  // 모바일은 브라우저처럼 HttpOnly 쿠키를 자동 처리하지 못하므로,
  //   - 요청 직전: native cookie store에서 쿠키를 읽어 Cookie 헤더로 첨부
  //   - 응답 직후: Set-Cookie 헤더를 native cookie store에 저장
  // 이 bridge가 없으면 refresh token 쿠키가 휘발돼 access token TTL 만료 시
  // refresh가 실패하고 사용자가 1시간 후 자동 로그아웃됨.
  setupCookieBridge();

  console.log('[API] Base URL set to:', Config.SERVER_BASE_URL);
};

const setupCookieBridge = () => {
  AXIOS_INSTANCE.interceptors.request.use(async config => {
    const url = buildAbsoluteUrl(config.baseURL, config.url);
    if (!url) return config;
    try {
      const cookies = await CookieManager.get(url);
      const cookieHeader = Object.entries(cookies)
        .map(([name, { value }]) => `${name}=${value}`)
        .join('; ');
      if (cookieHeader) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>).Cookie = cookieHeader;
      }
    } catch (err) {
      console.warn('[API] Cookie attach 실패:', err);
    }
    return config;
  });

  AXIOS_INSTANCE.interceptors.response.use(async response => {
    const url = buildAbsoluteUrl(response.config.baseURL, response.config.url);
    // axios는 Set-Cookie 헤더를 string 또는 string[]로 노출 (다중 쿠키일 때 배열)
    const setCookie = response.headers['set-cookie'] as
      | string
      | string[]
      | undefined;
    if (url && setCookie) {
      try {
        const headers = Array.isArray(setCookie) ? setCookie : [setCookie];
        for (const header of headers) {
          // setFromResponse는 단일 Set-Cookie 값을 받음 — 다중일 땐 순회
          await CookieManager.setFromResponse(url, header);
        }
      } catch (err) {
        console.warn('[API] Cookie 저장 실패:', err);
      }
    }
    return response;
  });
};

/** axios config에서 절대 URL 계산 — CookieManager는 origin 기준 scope 매칭 필요 */
const buildAbsoluteUrl = (
  baseURL: string | undefined,
  url: string | undefined,
): string | null => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (!baseURL) return null;
  return `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};
