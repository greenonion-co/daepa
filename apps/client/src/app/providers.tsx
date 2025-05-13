"use client";

import { OverlayProvider } from "overlay-kit";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <OverlayProvider>{children}</OverlayProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
