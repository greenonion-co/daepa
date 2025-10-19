"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import NotiButton from "./noti/components/NotiButton";
import { useEffect } from "react";
import { useUserStore } from "./store/user";
import { UserProfileDtoRole } from "@repo/api-client";
import { redirect } from "next/navigation";

const ROLES_BR_ALLOWED = [
  UserProfileDtoRole.BREEDER,
  UserProfileDtoRole.ADMIN,
] as UserProfileDtoRole[];

export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { initialize, user } = useUserStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!user || !ROLES_BR_ALLOWED.includes(user.role)) {
    // TODO!: 브리더스룸 소개 및 결제 안내 페이지 추가 후, 해당 페이지로 리다이렉트 처리
    redirect("/");
  }

  return (
    <>
      <AppSidebar />
      <main className="relative min-h-screen w-full p-2">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <NotiButton />
        </div>
        {children}
      </main>
    </>
  );
}
