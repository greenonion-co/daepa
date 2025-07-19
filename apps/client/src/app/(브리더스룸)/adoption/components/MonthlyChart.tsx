import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import { chartConfig } from "../constants";

interface MonthlyChartProps {
  data: { month: string; sold: number; onSale: number; onReservation: number; total: number }[];
}
const MonthlyChart = ({ data }: MonthlyChartProps) => (
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

export default MonthlyChart;
