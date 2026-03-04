"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PairList from "./components/PairList";
import MonthlyCalendar from "./components/MonthlyCalendar";
import { usePathname, useSearchParams } from "next/navigation";
import { useAppRouter } from "@/hooks/useAppRouter";
import PairStatisticsDashboard from "./components/PairStatisticsDashboard";
import { isNativeApp } from "@/lib/native-bridge";

const HatchingPage = () => {
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNative = isNativeApp();

  const current = searchParams.get("tab") ?? "pair";
  const urlTab = ["pair", "range", "dashboard"].includes(current) ? current : "pair";

  const [localTab, setLocalTab] = useState(urlTab);
  const value = isNative ? localTab : urlTab;

  return (
    <div>
      <Tabs
        value={value}
        onValueChange={(v) => {
          if (isNative) {
            setLocalTab(v);
          } else {
            const params = new URLSearchParams(Array.from(searchParams.entries()));
            params.set("tab", v);
            router.push(`${pathname}?${params.toString()}`);
          }
        }}
        className="flex flex-col"
      >
        <TabsList>
          <TabsTrigger value="pair">페어 목록</TabsTrigger>
          <TabsTrigger value="range">해칭 캘린더</TabsTrigger>
          <TabsTrigger value="dashboard">대시보드</TabsTrigger>
        </TabsList>

        <TabsContent value="pair">
          <PairList />
        </TabsContent>
        <TabsContent value="range">
          <MonthlyCalendar />
        </TabsContent>
        <TabsContent value="dashboard">
          <PairStatisticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HatchingPage;
