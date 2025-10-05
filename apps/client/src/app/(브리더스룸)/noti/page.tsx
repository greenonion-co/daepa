"use client";

import { Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { ResizablePanelGroup } from "@/components/ui/resizable";
import NotiList from "./components/NotiList";
import NotiDisplay from "./components/NotiDisplay";
import { useEffect, useState } from "react";
import {
  userNotificationControllerFindAll,
  UserNotificationDto,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";

const defaultLayout = [32, 48];

export default function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [items, setItems] = useState<UserNotificationDto[]>([]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [userNotificationControllerFindAll.name],
    queryFn: ({ pageParam = 1 }) =>
      userNotificationControllerFindAll({
        page: pageParam,
        itemPerPage: 10,
        order: "DESC",
      }),
    enabled: true,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
  });

  useEffect(() => {
    if (!data?.pages) return;
    if (tab === "all") {
      setItems(data?.pages.flatMap((page) => page.data.data) ?? []);
    } else {
      setItems(
        data?.pages
          .flatMap((page) => page.data.data)
          ?.filter((item) => item.status === UserNotificationDtoStatus.UNREAD) ?? [],
      );
    }
  }, [data?.pages, tab]);

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

          <NotiList
            items={items}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <NotiDisplay />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
