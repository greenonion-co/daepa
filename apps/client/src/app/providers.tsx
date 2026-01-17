"use client";

import { OverlayProvider } from "overlay-kit";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { setupApiClient } from "@/lib/setupApiClient";
import { AxiosError } from "axios";
import { AuthProvider } from "@/providers/AuthProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // 4xx 에러는 재시도하지 않음 (클라이언트 에러)
        if (
          error instanceof AxiosError &&
          error.response?.status &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          return false;
        }
        // 5xx 에러는 3번까지 재시도
        return failureCount < 3;
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupApiClient();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <SidebarProvider>
            <OverlayProvider>{children}</OverlayProvider>
          </SidebarProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
