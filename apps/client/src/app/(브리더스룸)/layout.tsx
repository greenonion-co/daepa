"use client";

import { useEffect } from "react";
import { useUserStore } from "./store/user";
import Menubar from "./components/Menubar";

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
    <main className="relative mx-auto min-h-screen w-full max-w-[1920px] p-2">
      <Menubar />
      {children}
    </main>
  );
}
