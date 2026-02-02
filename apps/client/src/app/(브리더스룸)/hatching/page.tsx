"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PairList from "./components/PairList";
import MonthlyCalendar from "./components/MonthlyCalendar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PairStatisticsDashboard from "./components/PairStatisticsDashboard";

const HatchingPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") ?? "pair";
  const value = ["pair", "range", "dashboard"].includes(current) ? current : "pair";

  return (
    <div>
      <Tabs
        value={value}
        onValueChange={(v) => {
          const params = new URLSearchParams(Array.from(searchParams.entries()));
          params.set("tab", v);
          router.replace(`${pathname}?${params.toString()}`);
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
