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
import { useState } from "react";
import { brEggControllerFindAll } from "@repo/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { TreeView } from "../components/TreeView";
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
  "2025-05-01": 10,
  "2025-05-02": 20,
  "2025-05-03": 30,
  "2025-05-04": 40,
  "2025-05-05": 50,
};

const HatchingPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  const itemPerPage = 10;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [brEggControllerFindAll.name],
    queryFn: ({ pageParam = 1 }) =>
      brEggControllerFindAll({
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
    select: (data) =>
      data.pages.flatMap((page) => page.data.data).filter((item) => !item.hatchedPetId),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((egg) => {
          return <TreeView key={egg.eggId} node={egg} />;
        })}
      </div>

      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={month}
          onMonthChange={setMonth}
          className="rounded-xl border shadow"
          eggCounts={eggCounts}
        />
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
                tickFormatter={(value) => value.slice(0, 3)}
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
