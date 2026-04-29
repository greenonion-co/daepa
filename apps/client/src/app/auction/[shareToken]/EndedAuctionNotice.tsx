"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

const REDIRECT_DELAY_SECONDS = 10;

export default function EndedAuctionNotice() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(REDIRECT_DELAY_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    const timeout = setTimeout(() => {
      router.replace("/");
    }, REDIRECT_DELAY_SECONDS * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center p-8">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <h2 className="text-lg font-semibold">이미 종료된 경매입니다.</h2>
          <p className="text-sm text-muted-foreground">
            {remaining}초 뒤 홈으로 이동합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
