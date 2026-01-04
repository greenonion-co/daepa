import { STATISTICS_COLORS } from "@/app/(브리더스룸)/constants";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

interface MonthlyStatsItem {
  month: number;
  fertilized: number;
  unfertilized: number;
  dead: number;
  pending: number;
  hatched: number;
}

interface MonthlyStatsChartProps {
  data: MonthlyStatsItem[];
}

const MONTH_NAMES = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

const MonthlyStatsChart = ({ data }: MonthlyStatsChartProps) => {
  // 데이터가 모두 0인지 확인
  const hasData = data.some(
    (item) =>
      item.fertilized > 0 ||
      item.unfertilized > 0 ||
      item.dead > 0 ||
      item.pending > 0 ||
      item.hatched > 0,
  );
  if (!hasData) return null;

  const chartData = data.map((item) => {
    const monthName =
      item.month >= 1 && item.month <= 12 ? MONTH_NAMES[item.month - 1] : `${item.month}월`;

    return {
      name: monthName,
      유정란: item.fertilized,
      무정란: item.unfertilized,
      중지란: item.dead,
      미정: item.pending,
      해칭: item.hatched,
    };
  });

  return (
    <ChartContainer
      config={{
        유정란: { label: "유정란", color: STATISTICS_COLORS.fertilized },
        무정란: { label: "무정란", color: STATISTICS_COLORS.unfertilized },
        중지란: { label: "중지란", color: STATISTICS_COLORS.dead },
        미정: { label: "미정", color: STATISTICS_COLORS.pending },
        해칭: { label: "해칭", color: STATISTICS_COLORS.hatched },
      }}
      className="h-[440px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ right: 15, left: 15 }} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }}
            tickLine={false}
            axisLine={false}
            width={15}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="유정란" stackId="eggs" fill={STATISTICS_COLORS.fertilized} />
          <Bar dataKey="무정란" stackId="eggs" fill={STATISTICS_COLORS.unfertilized} />
          <Bar dataKey="중지란" stackId="eggs" fill={STATISTICS_COLORS.dead} />
          <Bar
            dataKey="미정"
            stackId="eggs"
            fill={STATISTICS_COLORS.pending}
            radius={[0, 6, 6, 0]}
          />
          <Bar dataKey="해칭" fill={STATISTICS_COLORS.hatched} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default MonthlyStatsChart;
