"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/shared";
import type { ReportData } from "@/shared";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiDownload, apiFetch } from "@/lib/api-client";

export default function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => apiFetch<ReportData>("/api/reports"),
  });

  const download = async (format: "csv" | "excel" | "pdf") => {
    const blob = await apiDownload(`/api/export/${format}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = format === "excel" ? "xls" : format === "pdf" ? "html" : "csv";
    a.download = `kharcha-expenses.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <p className="text-muted-foreground">Loading reports...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => download("csv")}>
            <Download className="mr-2 h-4 w-4" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => download("excel")}>
            <Download className="mr-2 h-4 w-4" />Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => download("pdf")}>
            <Download className="mr-2 h-4 w-4" />PDF
          </Button>
        </div>
      </div>

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
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
