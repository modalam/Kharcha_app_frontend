"use client";

import { formatCurrency } from "@/shared";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type PieDataItem = {
  name: string;
  amount: number;
  color?: string | null;
};

type CategoryPieChartProps = {
  data: PieDataItem[];
  height?: number;
};

export function CategoryPieChart({ data, height = 200 }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available</p>;
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="70%"
            innerRadius="35%"
            paddingAngle={2}
            label={false}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color ?? `hsl(${i * 40}, 70%, 50%)`} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {data.map((entry, i) => {
          const percent = total > 0 ? Math.round((entry.amount / total) * 100) : 0;
          const fill = entry.color ?? `hsl(${i * 40}, 70%, 50%)`;

          return (
            <div
              key={entry.name}
              className="flex min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: fill }} />
                <span className="truncate font-medium">{entry.name}</span>
              </div>
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
