import { STATISTICS_COLORS } from "@/app/(브리더스룸)/constants";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  ComposedChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";

const tooltipBase = "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl";

const TooltipRow = ({ color, name, value }: { color: string; name: string; value: string }) => (
  <div className="flex items-center gap-2">
    <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
    <span className="text-muted-foreground">{name}</span>
    <span className="ml-auto font-mono font-medium tabular-nums text-foreground">{value}</span>
  </div>
);

const EggTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={tooltipBase}>
      <div className="font-medium">{label}</div>
      <div className="grid gap-1.5">
        {payload.map((item) => (
          <TooltipRow key={String(item.dataKey)} color={item.color ?? ""} name={String(item.name)} value={`${item.value}개`} />
        ))}
      </div>
    </div>
  );
};

const RateTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={tooltipBase}>
      <div className="font-medium">{label}</div>
      <div className="grid gap-1.5">
        {payload.map((item) => (
          <TooltipRow key={String(item.dataKey)} color={item.color ?? ""} name={String(item.name)} value={`${item.value}%`} />
        ))}
      </div>
    </div>
  );
};

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
  const hasData = data.some(
    (item) =>
      item.fertilized > 0 ||
      item.unfertilized > 0 ||
      item.dead > 0 ||
      item.pending > 0 ||
      item.hatched > 0,
  );
  if (!hasData) return null;

  const eggChartData = data.map((item) => ({
    name: item.month >= 1 && item.month <= 12 ? MONTH_NAMES[item.month - 1] : `${item.month}월`,
    유정란: item.fertilized,
    무정란: item.unfertilized,
    중지란: item.dead,
    미정: item.pending,
    해칭: item.hatched,
  }));

  const rateChartData = data.map((item) => {
    const determinedTotal = item.fertilized + item.unfertilized + item.dead + item.hatched;
    const fertilizedTotal = item.fertilized + item.hatched + item.dead;
    return {
      name: item.month >= 1 && item.month <= 12 ? MONTH_NAMES[item.month - 1] : `${item.month}월`,
      유정란율: determinedTotal > 0 ? Math.round((fertilizedTotal / determinedTotal) * 100) : 0,
      부화성공률: fertilizedTotal > 0 ? Math.round((item.hatched / fertilizedTotal) * 100) : 0,
    };
  });

  const tickStyle = { fontSize: 12, fontWeight: 600, fill: "hsl(var(--foreground))" };

  return (
    <div className="flex flex-col gap-6">
      {/* 알 상태 + 해칭 수 */}
      <div>
        <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          알 상태 (개) · 해칭 수 (선)
        </p>
        <ChartContainer
          config={{
            유정란: { label: "유정란", color: STATISTICS_COLORS.fertilized },
            무정란: { label: "무정란", color: STATISTICS_COLORS.unfertilized },
            중지란: { label: "중지란", color: STATISTICS_COLORS.dead },
            미정: { label: "미정", color: STATISTICS_COLORS.pending },
            해칭: { label: "해칭", color: STATISTICS_COLORS.hatched },
          }}
          className="h-[280px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={eggChartData}
              margin={{ left: -30, right: -35, top: 10 }}
              syncId="monthly-stats"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={tickStyle} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                allowDecimals={false}
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={EggTooltip}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="유정란"
                stackId="eggs"
                fill={STATISTICS_COLORS.fertilized}
              />
              <Bar
                yAxisId="left"
                dataKey="무정란"
                stackId="eggs"
                fill={STATISTICS_COLORS.unfertilized}
              />
              <Bar yAxisId="left" dataKey="중지란" stackId="eggs" fill={STATISTICS_COLORS.dead} />
              <Bar
                yAxisId="left"
                dataKey="미정"
                stackId="eggs"
                fill={STATISTICS_COLORS.pending}
                radius={[12, 12, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="해칭"
                stroke={STATISTICS_COLORS.hatched}
                strokeWidth={2.5}
                dot={{ fill: STATISTICS_COLORS.hatched, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* 비율 */}
      <div>
        <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">비율 (%)</p>
        <ChartContainer
          config={{
            유정란율: { label: "유정란율", color: STATISTICS_COLORS.fertilized },
            부화성공률: { label: "부화성공률", color: STATISTICS_COLORS.hatched },
          }}
          className="h-[220px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rateChartData}
              margin={{ left: -20, right: 8, top: 10 }}
              syncId="monthly-stats"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={tickStyle} tickLine={false} axisLine={false} />
              <YAxis
                domain={[0, 100]}
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip
                content={RateTooltip}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="유정란율"
                stroke={STATISTICS_COLORS.fertilized}
                strokeWidth={2}
                dot={{ fill: STATISTICS_COLORS.fertilized, r: 0 }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="부화성공률"
                stroke={STATISTICS_COLORS.hatched}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: STATISTICS_COLORS.hatched, r: 0 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default MonthlyStatsChart;
