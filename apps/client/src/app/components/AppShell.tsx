"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useUserStore } from "../(브리더스룸)/store/user";
import Menubar from "../(브리더스룸)/components/Menubar";
import Sidebar from "../(브리더스룸)/components/Sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import { useQuery } from "@tanstack/react-query";
import { userNotificationControllerGetUnreadCount } from "@repo/api-client";
import { isNativeApp } from "@/lib/native-bridge";
import AddPetButton from "@/app/(브리더스룸)/components/AddPetButton";
import QrScannerButton from "@/app/components/QrScannerButton";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPetDetail = pathname?.startsWith("/pet/") ?? false;
  const isShowcase = pathname?.startsWith("/@") ?? false;
  const isFamilyTree = /\/pet\/[^/]+\/breeding-map/.test(pathname ?? "");
  const isIntroPage = pathname === "/intro";
  const isSignIn = pathname?.startsWith("/sign-in") ?? false;
  const isMobile = useIsMobile();

  // 네이티브 앱에서 TopBar를 사용하거나 숨긴 경우 Menubar 숨김
  const hasNativeTopBar = isNativeApp() && searchParams.get("_nativeTopBar") === "1";
  const hasHiddenTopBar = isNativeApp() && searchParams.get("_hideTopBar") === "1";

  const { data: unreadCount = 0 } = useQuery({
    queryKey: [userNotificationControllerGetUnreadCount.name],
    queryFn: () => userNotificationControllerGetUnreadCount(),
    select: (response) => response.data.count,
    enabled: !!user,
  });

  if (isIntroPage) {
    return <>{children}</>;
  }

  return (
    <main
      className={`relative mx-auto flex w-full ${isFamilyTree ? "h-dvh overflow-hidden" : "min-h-screen"} ${isPetDetail ? "dark:bg-background bg-gray-100" : ""}`}
    >
      <div className={cn("w-full", !isMobile && "max-w-[calc(100%_-_var(--right-sidebar-width))]")}>
        {!hasNativeTopBar && !hasHiddenTopBar && !isFamilyTree && (!isShowcase || user) && (
          <Menubar unreadCount={unreadCount} />
        )}
        <div className={cn(isNativeApp() && "pb-[80px]")}>{children}</div>
      </div>
      {/* 모바일 플로팅 버튼 */}
      {isMobile && !isFamilyTree && !isShowcase && !isSignIn && (
        <>
          {!isNativeApp() && <AddPetButton />}
          <QrScannerButton />
        </>
      )}
      {/* 웹 */}
      {!isNativeApp() && !isMobile && <Sidebar unreadCount={unreadCount} />}
    </main>
  );
}
