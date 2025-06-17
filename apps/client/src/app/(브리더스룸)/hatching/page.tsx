"use client";

import { TrendingUp } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { brEggControllerFindAll } from "@repo/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { TreeView } from "../components/TreeView";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInView } from "react-intersection-observer";
import Loading from "@/components/common/Loading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

const HatchingPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [tab, setTab] = useState<"hached" | "noHatched">("noHatched");
  const { ref, inView } = useInView();
  const itemPerPage = 10;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery({
    queryKey: [brEggControllerFindAll.name, date],
    queryFn: ({ pageParam = 1 }) =>
      brEggControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "DESC",
        startYmd: Number(format(date, "yyyyMMdd")),
        endYmd: Number(format(date, "yyyyMMdd")),
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
    select: (data) => data.pages.flatMap((page) => page.data.data),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(day) => setDate(day as Date)}
          className="rounded-xl border shadow"
          eggCounts={eggCounts}
        />

        <ScrollArea className="relative flex h-[416px] w-full gap-2 rounded-xl border p-2 shadow">
          <Tabs
            defaultValue="noHatched"
            onValueChange={(value) => setTab(value as "hached" | "noHatched")}
            className="sticky top-0 z-10 bg-white pb-2"
          >
            <TabsList>
              <TabsTrigger value="noHatched">
                해칭되지 않은 알 ({data?.filter((egg) => !egg.hatchedPetId).length || 0})
              </TabsTrigger>
              <TabsTrigger value="hached">
                해칭된 알 ({data?.filter((egg) => egg.hatchedPetId).length || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {data
            ?.filter((egg) => (tab === "noHatched" ? !egg.hatchedPetId : egg.hatchedPetId))
            ?.map((egg) => <TreeView key={egg.eggId} node={egg} />)}
          {hasNextPage && (
            <div ref={ref} className="h-20 text-center">
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" />
                </div>
              ) : (
                <Loading />
              )}
            </div>
          )}
        </ScrollArea>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>해칭 대시보드</CardTitle>
          <CardDescription>1월 - 12월 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 20,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value: string) => value.slice(0, 3)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8}>
                <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Showing total visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default HatchingPage;

const chartData = [
  { month: "1월", desktop: 186 },
  { month: "2월", desktop: 305 },
  { month: "3월", desktop: 237 },
  { month: "4월", desktop: 73 },
  { month: "5월", desktop: 209 },
  { month: "6월", desktop: 214 },
  { month: "7월", desktop: 150 },
  { month: "8월", desktop: 100 },
  { month: "9월", desktop: 176 },
  { month: "10월", desktop: 100 },
  { month: "11월", desktop: 192 },
  { month: "12월", desktop: 320 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const eggCounts = {
  "2025-05-01": 2,
  "2025-05-02": 3,
  "2025-05-03": 2,
  "2025-05-04": 4,
  "2025-05-05": 6,
};
