"use client";

import { Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import {
  UpdateUserNotificationDto,
  userNotificationControllerFindAll,
  userNotificationControllerUpdate,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { ResizablePanelGroup } from "@/components/ui/resizable";
import NotiList from "./components/NotiList";
import NotiDisplay from "./components/NotiDisplay";
import { useState, useEffect } from "react";
import { UserNotificationDto } from "@repo/api-client";
import { useInView } from "react-intersection-observer";
import Loading from "@/components/common/Loading";

export default function NotificationsPage() {
  const [items, setItems] = useState<UserNotificationDto[]>([]);
  const [tab, setTab] = useState<"all" | "unread">("all");

  const { ref, inView } = useInView();
  const itemPerPage = 10;
  const defaultLayout = [32, 48];

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [userNotificationControllerFindAll.name, itemPerPage],
    queryFn: ({ pageParam = 1 }) =>
      userNotificationControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "DESC",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
  });

  const { mutate: updateNotification } = useMutation({
    mutationFn: (data: UpdateUserNotificationDto) => userNotificationControllerUpdate(data),
    onMutate: async (newData) => {
      // 낙관적 업데이트
      setItems((prev) =>
        prev.map((item) =>
          item.id === newData.id ? { ...item, status: UserNotificationDtoStatus.read } : item,
        ),
      );
    },
    onError: () => {
      // 에러 시 원래 상태로 복구
      setItems(items);
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (!data?.pages) return;
    if (tab === "all") {
      setItems(data?.pages.flatMap((page) => page.data.data) ?? []);
    } else {
      setItems(
        data?.pages
          .flatMap((page) => page.data.data)
          ?.filter((item) => item.status === UserNotificationDtoStatus.unread) ?? [],
      );
    }
  }, [data?.pages, tab]);

  if (isLoading) return <Loading />;

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
            handleUpdate={updateNotification}
            hasMore={hasNextPage}
            isFetchingMore={isFetchingNextPage}
            loaderRefAction={ref}
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
