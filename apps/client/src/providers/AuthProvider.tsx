"use client";

import { useEffect } from "react";
import { useUserStore } from "@/app/(브리더스룸)/store/user";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * localStorage의 토큰을 쿠키에 동기화
 * 네이티브 앱에서 주입된 토큰이 서버 컴포넌트에서도 사용될 수 있도록 함
 */
function syncTokenToCookie() {
  try {
    const token = localStorage.getItem("accessToken");
    if (token && token !== "null" && token !== "undefined") {
      const expires = new Date();
      expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일
      document.cookie = `accessToken=${token};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }
  } catch (error) {
    console.error("Failed to sync token to cookie:", error);
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize } = useUserStore();

  useEffect(() => {
    // 네이티브 앱에서 주입된 토큰을 쿠키에 동기화
    syncTokenToCookie();
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
