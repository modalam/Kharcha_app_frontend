"use client";

import { formatCompactCurrency } from "@/shared";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

type TrendLineChartProps = {
  data: Array<Record<string, unknown>>;
  /** The key on each data point used for the X axis (e.g. "week" or "date"). */
  xKey: string;
  height?: number;
  /** Optionally prettify the X-axis/tooltip label. */
  labelFormatter?: (value: string) => string;
};

export function TrendLineChart({
  data,
  xKey,
  height = 320,
  labelFormatter,
}: TrendLineChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis
          dataKey={xKey}
          tickFormatter={labelFormatter}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={8}
          minTickGap={16}
        />
        <YAxis
          tickFormatter={formatCompactCurrency}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          width={52}
        />
        <Tooltip
          cursor={{ stroke: "hsl(142 76% 36% / 0.35)", strokeWidth: 1 }}
          content={<ChartTooltip labelKey={xKey} labelFormatter={labelFormatter} />}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="hsl(142 76% 36%)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
