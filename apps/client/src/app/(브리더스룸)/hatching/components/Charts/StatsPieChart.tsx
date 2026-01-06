import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

interface PieChartDataItem {
  name: string;
  value: number;
  fill: string;
}

interface StatsPieChartProps {
  data: PieChartDataItem[];
  config: ChartConfig;
  format?: (value: any) => string;
  height?: string;
}

const StatsPieChart = ({
  data,
  config,
  format,
  height = "h-[250px] w-full",
}: StatsPieChartProps) => {
  if (data.length === 0) return null;

  return (
    <ChartContainer config={config} className={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          labelLine={false}
          label={({ cx, cy, midAngle, outerRadius, name, value, fill }) => {
            const RADIAN = Math.PI / 180;
            const radius = outerRadius * 1.2;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            return (
              <text
                x={x}
                y={y}
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                style={{ fontSize: 12, fontWeight: 500, fill }}
              >
                {`${name}: ${format ? format(value) : value}`}
              </text>
            );
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
      </PieChart>
    </ChartContainer>
  );
};

export default StatsPieChart;
