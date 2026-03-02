"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 bg-gray-800 px-4 py-2 text-sm text-white dark:bg-gray-700">
      <WifiOff className="h-4 w-4" />
      <span>네트워크 연결을 확인해주세요</span>
    </div>
  );
}
