"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdoptionTable from "./components/AdoptionTable";

const AdoptionPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") ?? "list";
  const value = ["list", "dashboard"].includes(current) ? current : "list";

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
          <TabsTrigger value="list">분양 리스트</TabsTrigger>
          <TabsTrigger value="dashboard">대시보드</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <AdoptionTable />
        </TabsContent>
        <TabsContent value="dashboard">{/* <AdoptionDashboard data={data} /> */}</TabsContent>
      </Tabs>
    </div>
  );
};

export default AdoptionPage;
