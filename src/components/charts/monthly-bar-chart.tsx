"use client";

import { formatCompactCurrency, formatMonthLabel } from "@/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

type MonthlyDataItem = {
  month: string;
  amount: number;
  count: number;
};

type MonthlyBarChartProps = {
  data: MonthlyDataItem[];
  height?: number;
};

export function MonthlyBarChart({ data, height = 320 }: MonthlyBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonthLabel}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={8}
        />
        <YAxis
          tickFormatter={formatCompactCurrency}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          width={52}
        />
        <Tooltip
          cursor={{ fill: "hsl(142 76% 36% / 0.08)" }}
          content={<ChartTooltip labelKey="month" labelFormatter={formatMonthLabel} />}
        />
        <Bar
          dataKey="amount"
          fill="hsl(142 76% 36%)"
          radius={[6, 6, 0, 0]}
          maxBarSize={64}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
