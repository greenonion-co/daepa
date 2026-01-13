"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { isNativeApp, navigate, requestGoBack } from "@/lib/native-bridge";

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
        navigate({ path });
        return;
      }
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
