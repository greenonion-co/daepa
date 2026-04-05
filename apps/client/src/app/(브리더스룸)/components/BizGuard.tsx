"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "../store/user";

// isBiz 체크를 하지 않는 경로 패턴 (비사업자도 접근 가능)
const BIZ_EXEMPT_PATHS = [
  /^\/settings(\/|$)/,
  /^\/pet\/[^/]+$/,
];

function isBizExemptPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "");
  return BIZ_EXEMPT_PATHS.some((pattern) => pattern.test(normalized));
}

/**
 * isBiz 계정만 접근 가능하도록 제한하는 가드.
 * 비사업자 계정이면 /beta-closed로 리다이렉트.
 * exempt 경로(settings, pet 상세)에서는 통과.
 */
export function BizGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const isExempt = isBizExemptPath(pathname);

  useEffect(() => {
    if (user && !user.isBiz && !isExempt) {
      router.replace("/beta-closed");
    }
  }, [user, router, isExempt]);

  // exempt 경로면 isBiz 상관없이 통과
  if (isExempt) {
    return <>{children}</>;
  }

  // user 로딩 중이거나 비사업자면 children 렌더링 안 함
  if (!user || !user.isBiz) {
    return null;
  }

  return <>{children}</>;
}
