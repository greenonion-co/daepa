"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/common/Loading";
import { useUserStore } from "@/app/(브리더스룸)/store/user";

export default function Home() {
  const router = useRouter();
  const { user, initialize } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initialize().finally(() => setIsInitialized(true));
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) return;

    const isLoggedIn = !!user?.userId;

    if (isLoggedIn) {
      router.replace("/pet");
    } else {
      router.replace("/sign-in");
    }
  }, [isInitialized, user, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loading />
    </div>
  );
}
