"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUserStore } from "./store/user";
import Menubar from "./components/Menubar";

export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { initialize } = useUserStore();
  const pathname = usePathname();
  const isPetDetail = pathname?.startsWith("/pet/") ?? false;

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <main
      className={`relative mx-auto min-h-screen w-full max-w-[1920px] p-2 ${
        isPetDetail ? "bg-gray-100" : ""
      }`}
    >
      <Menubar />
      {children}
    </main>
  );
}
