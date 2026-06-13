"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePathname, useSearchParams } from "next/navigation";
import { useAppRouter } from "@/hooks/useAppRouter";
import AdoptionTable from "./components/AdoptionTable";
import AdoptionDashboard from "./components/AdoptionDashboard";

// 경매 탭 콘텐츠는 탭 진입 시에만 로드 — 분양 목록/대시보드만 쓰는 사용자의 번들 부담 제거.
const MyAuctionsView = dynamic(
  () => import("../auction/MyAuctionsView").then((m) => m.MyAuctionsView),
  { ssr: false },
);

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
