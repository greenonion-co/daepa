"use client";

import { Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { ResizablePanelGroup } from "@/components/ui/resizable";
import NotiList from "./components/NotiList";
import NotiDisplay from "./components/NotiDisplay";
import { useState } from "react";

export default function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread">("all");

  const defaultLayout = [32, 48];

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout:noti=${JSON.stringify(sizes)}`;
      }}
      className="h-full items-stretch"
    >
      <ResizablePanel defaultSize={defaultLayout[0]} minSize={30}>
        <Tabs
          defaultValue="all"
          onValueChange={(value) => {
            setTab(value as "all" | "unread");
          }}
        >
          <div className="flex items-center px-4 py-1">
            <h1 className="text-xl font-bold">알림</h1>
            <TabsList className="ml-auto">
              <TabsTrigger value="all" className="text-zinc-600 dark:text-zinc-200">
                전체
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-zinc-600 dark:text-zinc-200">
                안읽음
              </TabsTrigger>
            </TabsList>
          </div>
          <Separator />
          <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
            <form>
              <div className="relative">
                <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
                <Input placeholder="Search" className="pl-8" />
              </div>
            </form>
          </div>

          <NotiList tab={tab} />
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <NotiDisplay />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
