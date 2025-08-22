"use client";

import { OverlayProvider } from "overlay-kit";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { setupApiClient } from "@/lib/setupApiClient";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupApiClient();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarProvider>
          <OverlayProvider>{children}</OverlayProvider>
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
