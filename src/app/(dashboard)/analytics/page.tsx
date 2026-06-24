"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="amount" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader><CardTitle>Weekly Spending Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={weekly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(142 76% 36%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={paymentMethods ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="method" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="amount" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
