"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../store/user";
import { toast } from "@/lib/toast";

/**
 * isBiz 계정만 접근 가능하도록 제한하는 가드.
 * 비사업자 계정이면 루트('/')로 리다이렉트 + 에러 토스트.
 */
export function BizGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    // user가 로드된 뒤 isBiz 확인
    if (user && !user.isBiz) {
      toast.error("권한이 없습니다");
      router.replace("/");
    }
  }, [user, router]);

  // user 로딩 중이거나 비사업자면 children 렌더링 안 함
  if (!user || !user.isBiz) {
    return null;
  }

  return <>{children}</>;
}
