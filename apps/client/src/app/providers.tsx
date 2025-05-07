"use client";

import { OverlayProvider } from "overlay-kit";
import { SidebarProvider } from "@/components/ui/sidebar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <OverlayProvider>{children}</OverlayProvider>
    </SidebarProvider>
  );
}
