"use client";

import { useQuery } from "@tanstack/react-query";
import { formatWeekLabel } from "@/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { PaymentBarChart } from "@/components/charts/payment-bar-chart";
import { TrendLineChart } from "@/components/charts/trend-line-chart";

export default function AnalyticsPage() {
  const { data: monthly } = useQuery({
    queryKey: ["analytics-monthly"],
    queryFn: () => apiFetch<Array<{ month: string; amount: number; count: number }>>("/api/analytics/monthly"),
  });

  const { data: weekly } = useQuery({
    queryKey: ["analytics-weekly"],
    queryFn: () => apiFetch<Array<{ week: string; amount: number; count: number }>>("/api/analytics/weekly"),
  });

  const { data: categories } = useQuery({
    queryKey: ["analytics-categories"],
    queryFn: () => apiFetch<Array<{ name: string; color: string; amount: number; count: number }>>("/api/analytics/categories"),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["analytics-payment-methods"],
    queryFn: () => apiFetch<Array<{ method: string; amount: number; count: number }>>("/api/analytics/payment-methods"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <Tabs defaultValue="monthly">
        <TabsList className="flex h-auto w-full max-w-full justify-start gap-1 overflow-x-auto p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="monthly" className="shrink-0 px-2.5 text-xs sm:px-3 sm:text-sm">
            Monthly
          </TabsTrigger>
          <TabsTrigger value="weekly" className="shrink-0 px-2.5 text-xs sm:px-3 sm:text-sm">
            Weekly
          </TabsTrigger>
          <TabsTrigger value="categories" className="shrink-0 px-2.5 text-xs sm:px-3 sm:text-sm">
            Categories
          </TabsTrigger>
          <TabsTrigger value="payment" className="shrink-0 px-2.5 text-xs sm:px-3 sm:text-sm">
            Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader><CardTitle>Monthly Spending Trend</CardTitle></CardHeader>
            <CardContent>
              <MonthlyBarChart data={monthly ?? []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader><CardTitle>Weekly Spending Trend</CardTitle></CardHeader>
            <CardContent>
              <TrendLineChart data={weekly ?? []} xKey="week" labelFormatter={formatWeekLabel} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
            <CardContent>
              <CategoryPieChart data={categories ?? []} height={220} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader><CardTitle>Payment Method Breakdown</CardTitle></CardHeader>
            <CardContent>
              <PaymentBarChart data={paymentMethods ?? []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
