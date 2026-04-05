"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "../store/user";

// 비로그인 사용자도 접근 가능한 경로 (인증 불필요)
const PUBLIC_PATHS = [
  /^\/pet\/(?!deleted$)[^/]+$/,
  /^\/pet\/(?!deleted$)[^/]+\/relation$/,
];

// 로그인 필요하지만 isBiz 체크는 면제되는 경로
const BIZ_EXEMPT_PATHS = [
  /^\/settings(\/|$)/,
  ...PUBLIC_PATHS,
];

function matchesPath(pathname: string, patterns: RegExp[]): boolean {
  const normalized = pathname.replace(/\/$/, "");
  return patterns.some((pattern) => pattern.test(normalized));
}

/**
 * isBiz 계정만 접근 가능하도록 제한하는 가드.
 * - PUBLIC 경로: 누구나 통과
 * - BIZ_EXEMPT 경로: 로그인 필요, isBiz 불필요
 * - 그 외: 로그인 + isBiz 필요
 */
export function BizGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const isInitialized = useUserStore((state) => state.isInitialized);
  const isPublic = matchesPath(pathname, PUBLIC_PATHS);
  const isBizExempt = matchesPath(pathname, BIZ_EXEMPT_PATHS);

  useEffect(() => {
    if (isPublic || !isInitialized) return;

    if (!user) {
      router.replace("/sign-in");
    } else if (!user.isBiz && !isBizExempt) {
      router.replace("/beta-closed");
    }
  }, [user, isInitialized, router, isPublic, isBizExempt]);

  // 공개 경로면 누구나 통과
  if (isPublic) {
    return <>{children}</>;
  }

  // biz 면제 경로면 로그인만 확인
  if (isBizExempt) {
    if (!user) return null;
    return <>{children}</>;
  }

  // user 로딩 중이거나 비사업자면 children 렌더링 안 함
  if (!user || !user.isBiz) {
    return null;
  }

  return <>{children}</>;
}
