import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, CartesianGrid, XAxis, Bar, LabelList } from "recharts";
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ChevronsLeft, TrendingUp } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { brPetControllerGetPetsByYear, PetDtoGrowth, PetDtoType } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import GuideText from "../../components/GuideText";

const Dashboard = memo(() => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isHatchedOnly, setIsHatchedOnly] = useState(false);
  // 연도별 해칭된 펫 조회
  const { data: yearData } = useQuery({
    queryKey: [brPetControllerGetPetsByYear.name, selectedYear],
    queryFn: () => brPetControllerGetPetsByYear(selectedYear.toString()),
    select: (data) => data.data,
  });

  // 연도별 차트 데이터 생성
  const chartData = useMemo(() => {
    if (!yearData) return [];

    const monthlyHatched = Array(12).fill(0);
    const monthlyNotHatched = Array(12).fill(0);

    Object.entries(yearData).forEach(([date, pets]) => {
      // yyyy-MM-dd 형식에서 월 추출
      const month = new Date(date).getMonth();
      monthlyHatched[month] += pets.filter(
        (pet) => pet.type === PetDtoType.PET && pet.growth !== PetDtoGrowth.DEAD,
      ).length;

      monthlyNotHatched[month] += isHatchedOnly
        ? 0
        : pets.filter((pet) => pet.type === PetDtoType.EGG).length;
    });

    return Array.from({ length: 12 }, (_, index) => ({
      month: `${index + 1}월`,
      hatched: monthlyHatched[index],
      notHatched: monthlyNotHatched[index],
      total: monthlyHatched[index] + monthlyNotHatched[index],
    }));
  }, [yearData, isHatchedOnly]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="mb-2 flex items-center gap-2">
              <Switch checked={isHatchedOnly} onCheckedChange={setIsHatchedOnly} />
              <span className="text-muted-foreground text-sm font-medium">해칭된 펫만 보기</span>

              <GuideText icon={ChevronsLeft} text="해칭된 펫만 조회해보세요!" />
            </div>

            <div>
              <CardTitle>해칭 대시보드</CardTitle>
              <CardDescription>1월 - 12월 {selectedYear}</CardDescription>
            </div>
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
  );
});

Dashboard.displayName = "Dashboard";

export default Dashboard;

const chartConfig = {
  hatched: {
    label: "해칭된 펫",
    color: "oklch(37.3% .034 259.733)",
  },
  notHatched: {
    label: "해칭되지 않은 펫",
    color: "oklch(21.3% .024 259.733)",
  },
  total: {
    label: "총 해칭 펫",
    color: "oklch(100% 0 0)",
  },
} satisfies ChartConfig;
