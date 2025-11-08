"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MatingList from "./components/MatingList";
import Dashboard from "./components/Dashboard";
import MonthlyCalendar from "./components/MonthlyCalendar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const HatchingPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") ?? "mating";
  const value = ["mating", "range", "dashboard"].includes(current) ? current : "mating";

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
          <TabsTrigger value="mating">메이팅 리스트</TabsTrigger>
          <TabsTrigger value="range">해칭 캘린더</TabsTrigger>
          <TabsTrigger value="dashboard">대시보드</TabsTrigger>
        </TabsList>

        <TabsContent value="mating">
          <MatingList />
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
