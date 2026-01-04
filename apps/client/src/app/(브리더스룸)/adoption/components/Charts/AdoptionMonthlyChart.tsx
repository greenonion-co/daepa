import { ADOPTION_STATISTICS_COLORS } from "@/app/(브리더스룸)/constants";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatPrice } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AdoptionMonthlyItem {
  month: number;
  count: number;
  revenue: number;
  averagePrice: number;
}

interface AdoptionMonthlyChartProps {
  data: AdoptionMonthlyItem[];
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

const formatRevenue = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만`;
  }
  return value.toLocaleString();
};

const AdoptionMonthlyChart = ({ data }: AdoptionMonthlyChartProps) => {
  const hasData = data.some((item) => item.count > 0 || item.revenue > 0);
  if (!hasData) return null;

  const chartData = data.map((item) => ({
    name: item.month >= 1 && item.month <= 12 ? MONTH_NAMES[item.month - 1] : "-",
    분양수: item.count,
    수익: item.revenue,
    평균분양가: item.averagePrice,
  }));

  return (
    <ChartContainer
      config={{
        분양수: { label: "분양 수", color: ADOPTION_STATISTICS_COLORS.count },
        수익: { label: "수익", color: ADOPTION_STATISTICS_COLORS.revenue },
        평균분양가: { label: "평균 분양가", color: ADOPTION_STATISTICS_COLORS.averagePrice },
      }}
      className="h-[300px] w-full pt-4"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickFormatter={(value) => `${value}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatRevenue}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(value, name) => {
              if (name === "분양수") return [name, " ", ` ${value}마리`];

              return [name, " ", formatPrice(value as number)];
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="분양수"
            stroke={ADOPTION_STATISTICS_COLORS.count}
            strokeWidth={2}
            dot={{ fill: ADOPTION_STATISTICS_COLORS.count, strokeWidth: 2, r: 0 }}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="수익"
            stroke={ADOPTION_STATISTICS_COLORS.revenue}
            strokeWidth={2}
            dot={{ fill: ADOPTION_STATISTICS_COLORS.revenue, strokeWidth: 2, r: 0 }}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="평균분양가"
            stroke={ADOPTION_STATISTICS_COLORS.averagePrice}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: ADOPTION_STATISTICS_COLORS.averagePrice, strokeWidth: 2, r: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default AdoptionMonthlyChart;
