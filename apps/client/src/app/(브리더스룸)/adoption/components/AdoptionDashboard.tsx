"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdoptionDto, PetDtoSaleStatus } from "@repo/api-client";
import { chartConfig, STATS_CARDS, STATUS_CONFIG } from "../constants";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdoptionDashboardProps {
  data?: AdoptionDto[];
}

// 통계 카드 컴포넌트
const StatCard = ({
  title,
  value,
  icon: Icon,
  bgColor,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  bgColor?: string;
}) => (
  <Card className={cn(bgColor)}>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-sm font-medium text-gray-800">{title}</CardTitle>
      <Icon className="h-4 w-4" />
    </CardHeader>
    <CardContent className="font-bold">{value}</CardContent>
  </Card>
);

// 상태별 분포 항목 컴포넌트
const StatusItem = ({ status, count }: { status: keyof typeof STATUS_CONFIG; count: number }) => {
  const config = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{config.label}</span>
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${config.color}`}></div>
        <span className="font-medium">{count}</span>
      </div>
    </div>
  );
};

// 차트 컴포넌트
const MonthlyChart = ({
  data,
}: {
  data: { month: string; sold: number; onSale: number; onReservation: number; total: number }[];
}) => (
  <ChartContainer config={chartConfig}>
    <BarChart accessibilityLayer data={data} margin={{ top: 25 }}>
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

      <Bar dataKey="nfs" stackId="a" fill="var(--color-nfs)" radius={[0, 0, 8, 8]} />
      <Bar dataKey="onReservation" stackId="a" fill="var(--color-onReservation)" />
      <Bar dataKey="onSale" stackId="a" fill="var(--color-onSale)" />
      <Bar dataKey="sold" stackId="a" fill="var(--color-sold)" radius={[8, 8, 0, 0]}>
        <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
      </Bar>
    </BarChart>
  </ChartContainer>
);

// 일별 분양 현황을 달력으로 표시하는 컴포넌트
const AdoptionCalendar = ({
  data,
  selectedYear,
  selectedMonth,
}: {
  data: AdoptionDto[];
  selectedYear: number;
  selectedMonth: number | null;
}) => {
  // 선택된 월의 일별 분양 데이터 생성
  const dailyAdoptionData = useMemo(() => {
    if (selectedMonth === null) return {};

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dailyData: Record<
      string,
      { sold: number; onSale: number; onReservation: number; total: number }
    > = {};

    // 해당 월의 모든 날짜에 대해 초기값 설정
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = format(new Date(selectedYear, selectedMonth - 1, day), "yyyyMMdd");
      dailyData[dateKey] = { sold: 0, onSale: 0, onReservation: 0, total: 0 };
    }

    // 실제 데이터로 채우기
    data.forEach((adoption) => {
      if (adoption.adoptionDate) {
        const date = new Date(adoption.adoptionDate);
        if (date.getFullYear() === selectedYear && date.getMonth() === selectedMonth - 1) {
          const dateKey = format(date, "yyyyMMdd");
          if (dailyData[dateKey]) {
            switch (adoption.status) {
              case PetDtoSaleStatus.SOLD:
                dailyData[dateKey].sold++;
                break;
              case PetDtoSaleStatus.ON_SALE:
                dailyData[dateKey].onSale++;
                break;
              case PetDtoSaleStatus.ON_RESERVATION:
                dailyData[dateKey].onReservation++;
                break;
            }
            dailyData[dateKey].total =
              dailyData[dateKey].sold +
              dailyData[dateKey].onSale +
              dailyData[dateKey].onReservation;
          }
        }
      }
    });

    return dailyData;
  }, [data, selectedYear, selectedMonth]);

  if (selectedMonth === null) {
    return (
      <Card className="text-muted-foreground flex h-64 items-center justify-center">
        <CardContent className="flex flex-col items-center justify-center gap-2 text-center text-sm">
          <Info className="h-6 w-6" />
          <span>월을 선택하면 해당 월의 일별 분양 현황을 달력으로 확인할 수 있습니다.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Calendar
      mode="single"
      month={new Date(selectedYear, selectedMonth - 1)}
      className="rounded-xl border shadow"
      disableNavigation
      classNames={{
        day: "h-20 w-11 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-50",
      }}
      components={{
        DayContent: ({ date }: { date: Date }) => {
          const dateKey = format(date, "yyyyMMdd");
          const count = dailyAdoptionData[dateKey] ?? {
            sold: 0,
            onSale: 0,
            onReservation: 0,
            total: 0,
          };

          return (
            <div className="flex w-full flex-col items-center justify-center gap-1">
              <span className="text-sm font-medium">{date.getDate()}</span>
              <div className="flex flex-col items-center gap-0.5">
                {count.sold > 0 && (
                  <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                    판매 {count.sold}
                  </span>
                )}
                {count.onSale > 0 && (
                  <span className="rounded-xl bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                    판매중 {count.onSale}
                  </span>
                )}
                {count.onReservation > 0 && (
                  <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
                    예약 {count.onReservation}
                  </span>
                )}
              </div>
            </div>
          );
        },
      }}
    />
  );
};

const AdoptionDashboard = ({ data = [] }: AdoptionDashboardProps) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);

  // 통계 카드와 분포용 데이터 (선택된 월이 있으면 해당 월, 없으면 해당 연도 전체)
  const statsData = useMemo(() => {
    return data.filter((adoption) => {
      if (!adoption.adoptionDate) return false;
      const date = new Date(adoption.adoptionDate);
      const yearMatch = date.getFullYear() === selectedYear;

      if (selectedMonth === null) {
        // 월이 선택되지 않았으면 해당 연도의 모든 월 데이터
        return yearMatch;
      } else {
        // 월이 선택되었으면 해당 월의 데이터만
        return yearMatch && date.getMonth() === selectedMonth - 1;
      }
    });
  }, [data, selectedYear, selectedMonth]);

  // 통계 카드용 데이터
  const stats = useMemo(() => {
    const totalAdoptions = statsData.length;
    const totalRevenue = statsData
      .filter((adoption) => adoption.status === PetDtoSaleStatus.SOLD)
      .reduce((sum, adoption) => sum + (adoption.price || 0), 0);
    const soldCount = statsData.filter(
      (adoption) => adoption.status === PetDtoSaleStatus.SOLD,
    ).length;
    const onSaleCount = statsData.filter(
      (adoption) => adoption.status === PetDtoSaleStatus.ON_SALE,
    ).length;
    const onReservationCount = statsData.filter(
      (adoption) => adoption.status === PetDtoSaleStatus.ON_RESERVATION,
    ).length;
    const nfsCount = statsData.filter(
      (adoption) => adoption.status === PetDtoSaleStatus.NFS,
    ).length;

    return {
      totalAdoptions,
      totalRevenue,
      soldCount,
      onSaleCount,
      onReservationCount,
      nfsCount,
    };
  }, [statsData]);

  const chartData = useMemo(() => {
    // 기존 월별 데이터 로직 유지
    const monthlyData = Array(12)
      .fill(0)
      .map(() => ({
        sold: 0,
        onSale: 0,
        onReservation: 0,
      }));

    data.forEach((adoption) => {
      if (adoption.adoptionDate) {
        const date = new Date(adoption.adoptionDate);
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth();
          switch (adoption.status) {
            case PetDtoSaleStatus.SOLD:
              monthlyData[month]!.sold++;
              break;
            case PetDtoSaleStatus.ON_SALE:
              monthlyData[month]!.onSale++;
              break;
            case PetDtoSaleStatus.ON_RESERVATION:
              monthlyData[month]!.onReservation++;
              break;
          }
        }
      }
    });

    return monthlyData.map((monthData, index) => ({
      month: `${index + 1}월`,
      ...monthData,
      total: monthData.sold + monthData.onSale + monthData.onReservation,
    }));
  }, [data, selectedYear]);

  return (
    <div className="space-y-6">
      {/* 연도/월 선택 */}
      <Card className="bg-gray-100 text-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            기간 선택
            <CardDescription className="font-normal">조회할 연도와 월을 선택하세요</CardDescription>
          </CardTitle>

          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => {
                  setSelectedYear(Number(value));
                  setSelectedMonth(null); // 연도 변경 시 월 선택 초기화
                }}
              >
                <SelectTrigger>
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
            <div className="flex-1">
              <Select
                value={selectedMonth?.toString() || "all"}
                onValueChange={(value) => setSelectedMonth(value === "all" ? null : Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체 월" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 월</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {month}월
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS_CARDS.map((card) => (
          <StatCard
            key={card.key}
            title={
              card.key === "totalRevenue" ? (selectedMonth ? "월 매출" : "연 매출") : card.title
            }
            value={card.formatter(stats[card.key as keyof typeof stats] as number)}
            icon={card.icon}
            bgColor={card.bgColor}
          />
        ))}
      </div>

      {/* 상태별 분포 */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>분양 상태별 분포</CardTitle>
            <CardDescription>
              {selectedYear}년 {selectedMonth ? `${selectedMonth}월` : "전체"} 분양 상태별 통계
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatusItem status="sold" count={stats.soldCount} />
              <StatusItem status="onSale" count={stats.onSaleCount} />
              <StatusItem status="onReservation" count={stats.onReservationCount} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center">
          <AdoptionCalendar data={data} selectedYear={selectedYear} selectedMonth={selectedMonth} />
        </div>
      </div>

      {/* 연도별 차트 (기존과 동일) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>분양 대시보드</CardTitle>
              <CardDescription>{selectedYear}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdoptionDashboard;
