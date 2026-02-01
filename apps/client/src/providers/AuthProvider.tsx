"use client";

import { useEffect } from "react";
import { useUserStore } from "@/app/(브리더스룸)/store/user";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize } = useUserStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
