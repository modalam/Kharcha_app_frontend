"use client";

import { formatCompactCurrency, formatCurrency } from "@/shared";
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

type PaymentDataItem = {
  method: string;
  amount: number;
  count: number;
};

type PaymentBarChartProps = {
  data: PaymentDataItem[];
  height?: number;
};

export function PaymentBarChart({ data, height = 260 }: PaymentBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available</p>;
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
          <XAxis
            type="number"
            tickFormatter={formatCompactCurrency}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            dataKey="method"
            type="category"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            width={72}
          />
          <Tooltip
            cursor={{ fill: "hsl(142 76% 36% / 0.08)" }}
            content={<ChartTooltip labelKey="method" />}
          />
          <Bar
            dataKey="amount"
            fill="hsl(142 76% 36%)"
            radius={[0, 6, 6, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        {data.map((entry) => {
          const percent = total > 0 ? Math.round((entry.amount / total) * 100) : 0;

          return (
            <div
              key={entry.method}
              className="flex min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span className="truncate font-medium">{entry.method}</span>
              <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                <span>{percent}%</span>
                <span className="font-medium text-foreground">{formatCurrency(entry.amount)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
