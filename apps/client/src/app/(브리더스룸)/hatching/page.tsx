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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo, useState } from "react";
import { brEggControllerFindAll } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { TreeView } from "../components/TreeView";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import Loading from "@/components/common/Loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import MatingList from "./components/MatingList";

const HatchingPage = () => {
  const [month, setMonth] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const [tab, setTab] = useState<"all" | "hatched" | "noHatched">("all");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const { data: yearData } = useQuery({
    queryKey: [brEggControllerFindAll.name, selectedYear],
    queryFn: () => {
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31);
      return brEggControllerFindAll({
        startYmd: Number(format(startDate, "yyyyMMdd")),
        endYmd: Number(format(endDate, "yyyyMMdd")),
      });
    },
    select: (data) => data.data,
  });

  const { data: monthlyData } = useQuery({
    queryKey: [brEggControllerFindAll.name, month],
    queryFn: () => {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      return brEggControllerFindAll({
        startYmd: Number(format(startDate, "yyyyMMdd")),
        endYmd: Number(format(endDate, "yyyyMMdd")),
      });
    },
    select: (data) => data.data,
  });

  const { data: selectedData, isPending: todayIsPending } = useQuery({
    queryKey: [brEggControllerFindAll.name, dateRange],
    queryFn: () =>
      brEggControllerFindAll({
        startYmd: dateRange?.from ? Number(format(dateRange.from, "yyyyMMdd")) : undefined,
        endYmd: dateRange?.to ? Number(format(dateRange.to, "yyyyMMdd")) : undefined,
      }),
    select: (data) => data.data,
  });

  const eggCounts = useMemo(() => {
    if (!monthlyData) return {};

    return Object.entries(monthlyData).reduce(
      (acc, [date, eggs]) => {
        // 해칭된 알과 해칭되지 않은 알 개수 계산
        const hatchedCount = eggs.filter((egg) => egg.hatchedPetId).length;
        const notHatchedCount = eggs.filter((egg) => !egg.hatchedPetId).length;

        // 날짜별로 해칭된 알과 해칭되지 않은 알 개수를 객체로 저장
        acc[date] = {
          hatched: hatchedCount,
          notHatched: notHatchedCount,
          total: eggs.length,
        };

        return acc;
      },
      {} as Record<string, { hatched: number; notHatched: number; total: number }>,
    );
  }, [monthlyData]);

  const chartData = useMemo(() => {
    if (!yearData) return [];

    const monthlyHatched = Array(12).fill(0);
    const monthlyNotHatched = Array(12).fill(0);

    Object.entries(yearData).forEach(([date, eggs]) => {
      const month = new Date(
        date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6, 8),
      ).getMonth();

      // 해칭된 알과 해칭되지 않은 알 개수 계산
      const hatchedCount = eggs.filter((egg) => egg.hatchedPetId).length;
      const notHatchedCount = eggs.filter((egg) => !egg.hatchedPetId).length;

      monthlyHatched[month] += hatchedCount;
      monthlyNotHatched[month] += notHatchedCount;
    });

    return Array.from({ length: 12 }, (_, index) => ({
      month: `${index + 1}월`,
      hatched: monthlyHatched[index],
      notHatched: monthlyNotHatched[index],
      total: monthlyHatched[index] + monthlyNotHatched[index],
    }));
  }, [yearData]);

  return (
    <div className="flex flex-col gap-4">
      <MatingList />
      <div className="flex gap-4">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          className="rounded-xl border shadow"
          eggCounts={eggCounts}
          onMonthChange={setMonth}
        />

        <ScrollArea className="relative flex h-[613px] w-full gap-2 rounded-xl border p-2 shadow">
          <div className="mb-3 rounded-xl bg-blue-100 px-3 py-2 text-center">
            <div className="text-sm font-medium text-blue-700">
              {dateRange?.from && dateRange?.to
                ? dateRange.from.getTime() === dateRange.to.getTime()
                  ? format(dateRange.from, "yyyy.MM.dd")
                  : `${format(dateRange.from, "yyyy.MM.dd")} - ${format(dateRange.to, "yyyy.MM.dd")}`
                : dateRange?.from
                  ? format(dateRange.from, "yyyy.MM.dd") + " ~ "
                  : "날짜를 선택해주세요"}
            </div>
          </div>
          <Tabs
            defaultValue="noHatched"
            onValueChange={(value) => setTab(value as "hatched" | "noHatched")}
            className="sticky top-0 z-10 pb-2"
          >
            <TabsList>
              <TabsTrigger value="all">
                전체 ({Object.values(selectedData || {}).flat().length || 0})
              </TabsTrigger>
              <TabsTrigger value="noHatched">
                해칭되지 않은 알 (
                {Object.values(selectedData || {})
                  .flat()
                  .filter((egg) => !egg.hatchedPetId).length || 0}
                )
              </TabsTrigger>
              <TabsTrigger value="hatched">
                해칭된 알 (
                {Object.values(selectedData || {})
                  .flat()
                  .filter((egg) => egg.hatchedPetId).length || 0}
                )
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {todayIsPending ? (
            <Loading />
          ) : (
            Object.entries(selectedData || {})
              .filter(([, eggs]) => {
                const filteredEggs = eggs.filter((egg) => {
                  if (tab === "all") return true;
                  return tab === "hatched" ? egg.hatchedPetId : !egg.hatchedPetId;
                });
                return filteredEggs.length > 0;
              })
              .map(([date, eggs]) => (
                <div key={date} className="mb-4">
                  <h3 className="mb-2 text-sm font-medium">
                    {format(
                      new Date(date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6, 8)),
                      "yyyy년 MM월 dd일",
                    )}
                  </h3>
                  <div className="space-y-2">
                    {eggs
                      .filter((egg) => {
                        if (tab === "all") return true;
                        return tab === "hatched" ? egg.hatchedPetId : !egg.hatchedPetId;
                      })
                      .map((egg) => (
                        <TreeView key={egg.eggId} node={egg} />
                      ))}
                  </div>
                </div>
              ))
          )}
        </ScrollArea>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>해칭 대시보드</CardTitle>
              <CardDescription>1월 - 12월 {selectedYear}</CardDescription>
            </div>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="연도 선택" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 25,
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
              <ChartLegend content={<ChartLegendContent />} />

              <Bar
                dataKey="notHatched"
                stackId="a"
                fill="oklch(68.1% .162 75.834)"
                radius={[0, 0, 8, 8]}
              />
              <Bar
                dataKey="hatched"
                stackId="a"
                fill="oklch(37.3% .034 259.733)"
                radius={[8, 8, 0, 0]}
              >
                <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            <TrendingUp className="h-4 w-4" />
            최근 1년 해칭 현황
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default HatchingPage;

const chartConfig = {
  hatched: {
    label: "해칭된 알",
  },
  notHatched: {
    label: "해칭안된 알",
  },
} satisfies ChartConfig;
