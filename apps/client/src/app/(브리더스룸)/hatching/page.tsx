"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MatingList from "./components/MatingList";
import Dashboard from "./components/Dashboard";
import RangeFilterCalendar from "./components/RangeFilterCalendar";

const HatchingPage = () => {
  return (
    <div>
      <div className="flex items-center px-4 py-1">
        <h1 className="text-xl font-bold">메이팅 & 해칭 관리</h1>
      </div>

      <Tabs defaultValue="mating" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="mating">메이팅 리스트</TabsTrigger>
          <TabsTrigger value="range">해칭 캘린더</TabsTrigger>
          <TabsTrigger value="dashboard">대시보드</TabsTrigger>
        </TabsList>

        <TabsContent value="mating">
          <MatingList />
        </TabsContent>
        <TabsContent value="range">
          <RangeFilterCalendar />
        </TabsContent>
        <TabsContent value="dashboard">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HatchingPage;
