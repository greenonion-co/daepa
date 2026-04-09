"use client";

import Link from "next/link";
import { useIsLoggedIn } from "@/hooks/useAuth";

export default function ShowroomHeader() {
  const isLoggedIn = useIsLoggedIn();

  return (
    <header className="flex h-[52px] items-center justify-between px-2">
      <Link href="/">
        <h1 className="px-1 text-lg font-bold">BREEDY</h1>
      </Link>
      {!isLoggedIn && (
        <Link
          href="/sign-in"
          className="rounded-full px-3 py-1 text-xs font-medium text-blue-500"
        >
          로그인
        </Link>
      )}
    </header>
  );
}
