"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PairList from "./components/PairList";
import Dashboard from "./components/Dashboard";
import MonthlyCalendar from "./components/MonthlyCalendar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
        className="flex flex-col gap-4"
      >
        <TabsList>
          <TabsTrigger value="pair">페어 리스트</TabsTrigger>
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
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HatchingPage;
