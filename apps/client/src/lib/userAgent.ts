/**
 * 클라이언트 환경 감지 유틸. SSR-safe (typeof window 가드 포함).
 *
 * 사용처: AppInstallPrompt에서 어떤 UI를 보여줄지 분기.
 */

export interface ClientEnv {
  isInApp: boolean;        // RN WebView 내부
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isKakaoInApp: boolean;
  isInstagramInApp: boolean;
  isFacebookInApp: boolean;
  isInAppBrowser: boolean; // 카톡/인스타/페북 인앱 브라우저 통합
  isDesktop: boolean;
}

const SSR_DEFAULTS: ClientEnv = {
  isInApp: false,
  isMobile: false,
  isIOS: false,
  isAndroid: false,
  isKakaoInApp: false,
  isInstagramInApp: false,
  isFacebookInApp: false,
  isInAppBrowser: false,
  isDesktop: false,
};

export function detectClientEnv(): ClientEnv {
  if (typeof window === "undefined") return SSR_DEFAULTS;

  const ua = navigator.userAgent;
  const isInApp = !!window.ReactNativeWebView || !!window.isNativeApp;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi/.test(ua);
  const isKakaoInApp = /KAKAOTALK/i.test(ua);
  const isInstagramInApp = /Instagram/i.test(ua);
  const isFacebookInApp = /FBAN|FBAV/i.test(ua);
  const isInAppBrowser = isKakaoInApp || isInstagramInApp || isFacebookInApp;

  return {
    isInApp,
    isMobile,
    isIOS,
    isAndroid,
    isKakaoInApp,
    isInstagramInApp,
    isFacebookInApp,
    isInAppBrowser,
    isDesktop: !isMobile,
  };
}
