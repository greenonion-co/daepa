/**
 * 앱 설치 유도 UI의 노출 상태를 localStorage/sessionStorage에 기록.
 *
 * - Banner: 7일간 다시 안 보기 (localStorage)
 * - BottomSheet: 세션 동안 다시 안 보기 (sessionStorage)
 * - KakaoInAppGuide: 세션 동안 다시 안 보기 (sessionStorage)
 */

const BANNER_KEY = "appPrompt.banner.dismissedUntil";
const BOTTOM_SHEET_KEY = "appPrompt.bottomSheet.dismissed";
const KAKAO_GUIDE_KEY = "appPrompt.kakaoGuide.dismissed";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function isBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(BANNER_KEY);
    if (!v) return false;
    return Date.now() < parseInt(v, 10);
  } catch {
    return false;
  }
}

export function dismissBanner(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BANNER_KEY, String(Date.now() + SEVEN_DAYS_MS));
  } catch {
    /* storage 불가(시크릿 모드 등)는 무시 */
  }
}

export function isBottomSheetDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(BOTTOM_SHEET_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissBottomSheet(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BOTTOM_SHEET_KEY, "1");
  } catch {
    /* noop */
  }
}

export function isKakaoGuideDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(KAKAO_GUIDE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissKakaoGuide(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KAKAO_GUIDE_KEY, "1");
  } catch {
    /* noop */
  }
}
