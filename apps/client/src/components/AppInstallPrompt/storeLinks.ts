/**
 * 앱 스토어 / 인텐트 URL 빌더.
 */

export const APP_STORE_ID = "6758280555";
export const ANDROID_PACKAGE = "com.greenonion.daepa";
export const APP_LINK_HOST = "breedy.kr";
export const CUSTOM_SCHEME = "breedy";

export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

/**
 * iOS custom scheme deep link — 앱 설치돼 있으면 열림, 없으면 무반응.
 * 폴백은 호출부에서 visibility/타이머로 처리.
 */
export function buildIOSDeepLinkUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${CUSTOM_SCHEME}://${cleanPath}`;
}

/**
 * Android 인텐트 URL — 앱이 설치돼 있으면 열고, 없으면 Play Store 폴백.
 * Chrome / Samsung Internet 등 대부분의 브라우저가 이 형식을 처리.
 */
export function buildAndroidIntentUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fallback = encodeURIComponent(PLAY_STORE_URL);
  return (
    `intent://${APP_LINK_HOST}${cleanPath}` +
    `#Intent;scheme=https;package=${ANDROID_PACKAGE};` +
    `S.browser_fallback_url=${fallback};end`
  );
}
