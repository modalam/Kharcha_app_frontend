"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/shared";
import type { ReportData } from "@/shared";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiDownload, apiFetch } from "@/lib/api-client";

type RangePreset = "today" | "yesterday" | "month" | "last-month" | "year" | "custom";

const PRESET_LABELS: Record<RangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  month: "Current Month",
  "last-month": "Last Month",
  year: "This Year",
  custom: "Custom Range",
};

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function presetRange(preset: RangePreset, customFrom: string, customTo: string) {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: ymd(now), to: ymd(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      return { from: ymd(y), to: ymd(y) };
    }
    case "month":
      return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(now) };
    case "last-month":
      return {
        from: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: ymd(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "year":
      return { from: ymd(new Date(now.getFullYear(), 0, 1)), to: ymd(now) };
    case "custom":
      return { from: customFrom, to: customTo };
  }
}

export default function ReportsPage() {
  const [preset, setPreset] = useState<RangePreset>("month");
  const today = ymd(new Date());
  const [customFrom, setCustomFrom] = useState(
    ymd(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [customTo, setCustomTo] = useState(today);

  const range = useMemo(
    () => presetRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );

  const rangeValid = Boolean(range.from && range.to && range.from <= range.to);
  const queryString = rangeValid
    ? `?dateFrom=${range.from}&dateTo=${range.to}`
    : "";

  const { data, isLoading } = useQuery({
    queryKey: ["reports", range.from, range.to],
    queryFn: () => apiFetch<ReportData>(`/api/reports${queryString}`),
    enabled: rangeValid,
  });

  const [downloading, setDownloading] = useState<string | null>(null);

  const download = async (format: "csv" | "excel" | "pdf") => {
    if (!rangeValid) return;
    setDownloading(format);
    try {
      const blob = await apiDownload(`/api/export/${format}${queryString}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "excel" ? "xls" : format === "pdf" ? "html" : "csv";
      a.download = `kharcha-${range.from}_to_${range.to}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Date range + downloads */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="range-select">Date range</Label>
                <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
                  <SelectTrigger id="range-select" className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRESET_LABELS) as RangePreset[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {PRESET_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {preset === "custom" && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="from-date">From</Label>
                    <Input
                      id="from-date"
                      type="date"
                      max={customTo || today}
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full sm:w-40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="to-date">To</Label>
                    <Input
                      id="to-date"
                      type="date"
                      min={customFrom}
                      max={today}
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full sm:w-40"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Download report</span>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!rangeValid || downloading !== null}
                  onClick={() => download("csv")}
                >
                  <Download className="mr-2 h-4 w-4" />CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!rangeValid || downloading !== null}
                  onClick={() => download("excel")}
                >
                  <Download className="mr-2 h-4 w-4" />Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!rangeValid || downloading !== null}
                  onClick={() => download("pdf")}
                >
                  <Download className="mr-2 h-4 w-4" />PDF
                </Button>
              </div>
            </div>
          </div>

          {rangeValid ? (
            <p className="text-xs text-muted-foreground">
              Showing {range.from} to {range.to}
            </p>
          ) : (
            <p className="text-xs text-destructive">
              Please pick a valid date range (the start date must be on or before the end date).
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading reports...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Highest Expense Day</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.highestExpenseDay ? (
                  <>
                    <p className="text-2xl font-bold">{formatCurrency(data.highestExpenseDay.amount)}</p>
                    <p className="text-sm text-muted-foreground">{data.highestExpenseDay.date}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Avg Daily Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(data?.averageDailySpending ?? 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Avg Monthly Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(data?.averageMonthlySpending ?? 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Spending Insights</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(data?.insights ?? []).map((insight, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                  <Badge
                    className={
                      insight.type === "savings"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : insight.type === "increase"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : insight.type === "decrease"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : ""
                    }
                  >
                    {insight.type}
                  </Badge>
                  <p className="text-sm">{insight.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top Categories</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(data?.topCategories ?? []).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color ?? "#6b7280" }} />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
                {(data?.topCategories ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No expenses in this period</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Month</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2 text-right">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.monthlySummary ?? []).map((row) => (
                      <tr key={row.month} className="border-b">
                        <td className="py-2">{row.month}</td>
                        <td className="py-2 text-right">{formatCurrency(row.amount)}</td>
                        <td className="py-2 text-right">{row.count}</td>
                      </tr>
                    ))}
                    {(data?.monthlySummary ?? []).length === 0 && (
                      <tr>
                        <td className="py-2 text-muted-foreground" colSpan={3}>
                          No expenses in this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
