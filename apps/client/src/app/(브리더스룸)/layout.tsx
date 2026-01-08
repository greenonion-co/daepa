"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUserStore } from "./store/user";
import Menubar from "./components/Menubar";
import Sidebar from "./components/Sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import { useQuery } from "@tanstack/react-query";
import { userNotificationControllerGetUnreadCount } from "@repo/api-client";
import PetPreviewModal from "./pet/components/PetPreviewModal";

export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { initialize, user } = useUserStore();
  const pathname = usePathname();
  const isPetDetail = pathname?.startsWith("/pet/") ?? false;
  const isMobile = useIsMobile();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: [userNotificationControllerGetUnreadCount.name],
    queryFn: () => userNotificationControllerGetUnreadCount(),
    select: (response) => response.data.count,
    enabled: !!user,
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <main
      className={`relative mx-auto flex min-h-screen w-full ${isPetDetail ? "dark:bg-background bg-gray-100" : ""}`}
    >
      <div className={cn("w-full", !isMobile && "max-w-[calc(100%-55px)]")}>
        <Menubar unreadCount={unreadCount} />
        {children}
      </div>
      {!isMobile && <Sidebar unreadCount={unreadCount} />}
      <PetPreviewModal />
    </main>
  );
}
