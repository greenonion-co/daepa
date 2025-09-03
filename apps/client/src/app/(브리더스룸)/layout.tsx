"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import NotiButton from "./noti/components/NotiButton";
import { useEffect } from "react";
import { useUserStore } from "./store/user";

export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { initialize } = useUserStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <AppSidebar />
      <main className="min-h-screen w-full p-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <NotiButton />
        </div>
        {children}
      </main>
    </>
  );
}
