"use client";

import { Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  UpdateUserNotificationDto,
  userNotificationControllerFindAll,
  userNotificationControllerUpdate,
} from "@repo/api-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { ResizablePanelGroup } from "@/components/ui/resizable";
import NotiList from "./components/NotiList";
import NotiDisplay from "./components/NotiDisplay";
import { useState, useEffect } from "react";
import { UserNotificationDto } from "@repo/api-client";

export default function NotificationsPage() {
  const [items, setItems] = useState<UserNotificationDto[]>([]);

  const { data: notification } = useQuery({
    queryKey: ["notification"],
    queryFn: () => userNotificationControllerFindAll(),
    select: (response) => response.data.data,
  });

  useEffect(() => {
    if (notification) {
      setItems(notification);
    }
  }, [notification]);

  const { mutate: updateNotification } = useMutation({
    mutationFn: (data: UpdateUserNotificationDto) => userNotificationControllerUpdate(data),
    onMutate: async (newData) => {
      // 낙관적 업데이트
      setItems((prev) =>
        prev.map((item) => (item.id === newData.id ? { ...item, status: "READ" } : item)),
      );
    },
    onError: () => {
      // 에러 시 원래 상태로 복구
      setItems(items);
    },
  });

  const defaultLayout = [32, 48];

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout:noti=${JSON.stringify(sizes)}`;
      }}
      className="h-full max-h-[800px] items-stretch"
    >
      <ResizablePanel defaultSize={defaultLayout[0]} minSize={30}>
        <Tabs defaultValue="all">
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
          <TabsContent value="all" className="m-0">
            <NotiList items={items} handleUpdate={updateNotification} />
          </TabsContent>
          <TabsContent value="unread" className="m-0">
            <NotiList
              items={items?.filter((item) => item.status === "UNREAD") ?? []}
              handleUpdate={updateNotification}
            />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <NotiDisplay />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
