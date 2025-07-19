"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdoptionDto, AdoptionDtoStatus } from "@repo/api-client";
import { STATS_CARDS } from "../constants";
import AdoptionCalendar from "./AdoptionCalendar";
import MonthlyChart from "./MonthlyChart";
import StatusItem from "./StatusItem";
import StatCard from "./StatCard";

interface AdoptionDashboardProps {
  data?: AdoptionDto[];
}

const AdoptionDashboard = ({ data = [] }: AdoptionDashboardProps) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);

  // 통계 카드와 분포용 데이터 (선택된 월이 있으면 해당 월, 없으면 해당 연도 전체)
  const statsData = useMemo(() => {
    return data.filter((adoption) => {
      if (adoption.status === AdoptionDtoStatus.NFS) return false;
      if (!adoption.adoptionDate) return true;

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
      .filter((adoption) => adoption.status === AdoptionDtoStatus.SOLD)
      .reduce((sum, adoption) => sum + (adoption.price || 0), 0);
    const soldCount = statsData.filter(
      (adoption) => adoption.status === AdoptionDtoStatus.SOLD,
    ).length;
    const onSaleCount = statsData.filter(
      (adoption) => adoption.status === AdoptionDtoStatus.ON_SALE,
    ).length;
    const onReservationCount = statsData.filter(
      (adoption) => adoption.status === AdoptionDtoStatus.ON_RESERVATION,
    ).length;
    const nfsCount = statsData.filter(
      (adoption) => adoption.status === AdoptionDtoStatus.NFS,
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
      // adoptionDate가 null이면 차트에서 제외
      if (!adoption.adoptionDate) return;

      const date = new Date(adoption.adoptionDate);
      if (date.getFullYear() === selectedYear) {
        const month = date.getMonth();
        switch (adoption.status) {
          case AdoptionDtoStatus.SOLD:
            monthlyData[month]!.sold++;
            break;
          case AdoptionDtoStatus.ON_SALE:
            monthlyData[month]!.onSale++;
            break;
          case AdoptionDtoStatus.ON_RESERVATION:
            monthlyData[month]!.onReservation++;
            break;
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
