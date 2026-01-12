"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useUserStore } from "./store/user";
import Menubar from "./components/Menubar";
import Sidebar from "./components/Sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import { useQuery } from "@tanstack/react-query";
import { userNotificationControllerGetUnreadCount } from "@repo/api-client";
import { isNativeApp } from "@/lib/native-bridge";

export default function BrLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const { user } = useUserStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPetDetail = pathname?.startsWith("/pet/") ?? false;
  const isMobile = useIsMobile();

  // 네이티브 앱에서 TopBar를 사용하는 경우 Menubar 숨김
  const hasNativeTopBar = isNativeApp() && searchParams.get("_nativeTopBar") === "1";

  const { data: unreadCount = 0 } = useQuery({
    queryKey: [userNotificationControllerGetUnreadCount.name],
    queryFn: () => userNotificationControllerGetUnreadCount(),
    select: (response) => response.data.count,
    enabled: !!user,
  });

  return (
    <main
      className={`relative mx-auto flex min-h-screen w-full ${isPetDetail ? "dark:bg-background bg-gray-100" : ""}`}
    >
      <div className={cn("w-full", !isMobile && "max-w-[calc(100%-55px)]")}>
        {!hasNativeTopBar && <Menubar unreadCount={unreadCount} />}
        {children}
      </div>
      {!isNativeApp() && isMobile && <Sidebar unreadCount={unreadCount} />}
      {modal}
    </main>
  );
}
