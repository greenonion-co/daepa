"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePathname, useSearchParams } from "next/navigation";
import { useAppRouter } from "@/hooks/useAppRouter";
import AdoptionTable from "./components/AdoptionTable";
import AdoptionDashboard from "./components/AdoptionDashboard";
import { MyAuctionsView } from "../auction/MyAuctionsView";

const AdoptionPage = () => {
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") ?? "list";
  const value = ["list", "auction", "dashboard"].includes(current) ? current : "list";

  return (
    <div>
      <Tabs
        value={value}
        onValueChange={(v) => {
          const params = new URLSearchParams(Array.from(searchParams.entries()));
          params.set("tab", v);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="flex flex-col gap-4"
      >
        <TabsList>
          <TabsTrigger value="list">분양 목록</TabsTrigger>
          <TabsTrigger value="auction">경매</TabsTrigger>
          <TabsTrigger value="dashboard">대시보드</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <AdoptionTable />
        </TabsContent>
        <TabsContent value="auction">
          <MyAuctionsView />
        </TabsContent>
        <TabsContent value="dashboard">
          <AdoptionDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdoptionPage;
