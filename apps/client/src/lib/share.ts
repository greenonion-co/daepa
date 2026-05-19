import { isNativeApp, requestShare } from "@/lib/native-bridge";
import { toast } from "@/lib/toast";

interface SharePageOptions {
  /** "/pet/abc" 형태의 절대 path */
  path: string;
  title?: string;
  text?: string;
  /** 폴백(클립보드) 성공 시 보여줄 토스트 메시지 */
  copySuccessMessage?: string;
}

/**
 * 페이지 공유 — Universal Link 진입을 보장하기 위해 URL 규칙을 일관되게 적용한다.
 *
 * 1. URL은 항상 `https://<origin><path>?ref=share` 형태.
 *    → 모바일 브라우저에서 열렸을 때 BottomSheet 인터스티셜이 표시됨.
 * 2. 우선순위: 네이티브 앱 SHARE → Web Share API → 클립보드 폴백.
 */
export async function sharePage({
  path,
  title,
  text,
  copySuccessMessage = "링크가 복사되었습니다",
}: SharePageOptions): Promise<void> {
  const url = buildShareUrl(path);

  if (isNativeApp()) {
    if (requestShare(url, title)) return;
    // 브릿지 호출 실패 시 클립보드 폴백
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ url, title, text });
      return;
    } catch (e) {
      // 사용자가 공유 시트를 닫은 경우는 폴백 없이 종료
      if (e instanceof Error && e.name === "AbortError") return;
      // 그 외 실패(권한 등)는 클립보드로 폴백
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success(copySuccessMessage);
  } catch {
    toast.error("링크 복사에 실패했습니다");
  }
}

export function buildShareUrl(path: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://breedy.kr";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const u = new URL(`${origin}${normalized}`);
  u.searchParams.set("ref", "share");
  return u.toString();
}
