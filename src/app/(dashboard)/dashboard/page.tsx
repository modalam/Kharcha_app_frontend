"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import type { DashboardData } from "@/shared";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardData>("/api/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Today's Spending", value: data?.cards.todaySpending ?? 0 },
    { title: "Weekly Spending", value: data?.cards.weeklySpending ?? 0 },
    { title: "Monthly Spending", value: data?.cards.monthlySpending ?? 0 },
    { title: "Lifetime Spending", value: data?.cards.lifetimeSpending ?? 0 },
    {
      title: "Top Category",
      value: data?.cards.highestCategory?.amount ?? 0,
      subtitle: data?.cards.highestCategory?.name,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(card.value)}</p>
              {card.subtitle && <p className="text-xs text-muted-foreground">{card.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spending Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.widgets.spendingTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="amount" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.widgets.topCategories ?? []}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name }) => name}
                >
                  {(data?.widgets.topCategories ?? []).map((entry, i) => (
                    <Cell key={i} fill={entry.color ?? `hsl(${i * 40}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.widgets.recentExpenses ?? []).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{expense.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {expense.category?.name} · {expense.expenseDate}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                </div>
              ))}
              {(data?.widgets.recentExpenses ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No expenses yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total this month</span>
              <span className="font-semibold">
                {formatCurrency(data?.widgets.financialSummary.totalExpenses ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average daily</span>
              <span className="font-semibold">
                {formatCurrency(data?.widgets.financialSummary.averageDaily ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transactions</span>
              <span className="font-semibold">{data?.widgets.financialSummary.expenseCount ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
