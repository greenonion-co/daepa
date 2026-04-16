"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { isNativeApp, navigate, requestGoBack } from "@/lib/native-bridge";
import { startProgress } from "@/components/common/NavigationProgress";

/**
 * 네이티브 앱과 웹 모두에서 동작하는 라우터 훅
 * - 네이티브 앱: window.location으로 이동 (RSC 페이로드 에러 방지)
 * - 웹: 일반 Next.js router 사용
 */
export function useAppRouter() {
  const router = useRouter();

  const push = useCallback(
    (path: string) => {
      if (isNativeApp()) {
        // 같은 pathname 내 쿼리 변경은 WebView 내부에서 처리 (네이티브 push 방지)
        const targetPathname = path.split(/[?#]/)[0];
        const currentPathname = window.location.pathname;
        if (targetPathname === currentPathname) {
          window.location.href = path;
          return;
        }
        navigate({ path });
        return;
      }
      startProgress();
      router.push(path);
    },
    [router],
  );

  const replace = useCallback(
    (path: string) => {
      if (isNativeApp()) {
        navigate({ path, options: { replace: true } });
        return;
      }
      startProgress();
      router.replace(path);
    },
    [router],
  );

  const back = useCallback(() => {
    if (isNativeApp()) {
      requestGoBack();
      return;
    }
    router.back();
  }, [router]);

  return useMemo(
    () => ({
      ...router,
      push,
      replace,
      back,
    }),
    [router, push, replace, back],
  );
}
