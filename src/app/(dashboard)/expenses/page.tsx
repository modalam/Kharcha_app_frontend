"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatCurrency, PAYMENT_METHODS, type Category, type Expense, type PaginatedResponse } from "@/shared";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { useExpenseFiltersStore } from "@/stores/auth";

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const filters = useExpenseFiltersStore();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "20",
    ...(filters.search && { q: filters.search }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.year && { year: String(filters.year) }),
    ...(filters.month && { month: String(filters.month) }),
    ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
    ...(filters.amountMin !== undefined && { amountMin: String(filters.amountMin) }),
    ...(filters.amountMax !== undefined && { amountMax: String(filters.amountMax) }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses", page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Expense>>(`/api/expenses?${queryParams}`),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/api/categories/list"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch("/api/expenses/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }),
    onSuccess: () => {
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch("/api/expenses/duplicate", { method: "POST", body: JSON.stringify({ id }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Expense" : "New Expense"}</DialogTitle>
            </DialogHeader>
            <ExpenseForm
              categories={categories ?? []}
              expense={editing}
              onSuccess={() => {
                setDialogOpen(false);
                setEditing(null);
                queryClient.invalidateQueries({ queryKey: ["expenses"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search title or notes..."
              value={filters.search}
              onChange={(e) => filters.setFilter("search", e.target.value)}
            />
            <Select value={filters.categoryId || "all"} onValueChange={(v) => filters.setFilter("categoryId", v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.paymentMethod || "all"} onValueChange={(v) => filters.setFilter("paymentMethod", v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => filters.resetFilters()}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {selected.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm">{selected.length} selected</span>
          <Button variant="destructive" size="sm" onClick={() => bulkDeleteMutation.mutate(selected)}>
            Delete Selected
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (expenses?.data ?? []).length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No expenses found</CardContent></Card>
        ) : (
          (expenses?.data ?? []).map((expense) => (
            <Card key={expense.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <input
                  type="checkbox"
                  checked={selected.includes(expense.id)}
                  onChange={() => toggleSelect(expense.id)}
                  className="h-4 w-4"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{expense.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.category?.name} · {expense.expenseDate}
                    {expense.paymentMethod && ` · ${expense.paymentMethod}`}
                  </p>
                </div>
                <p className="font-semibold whitespace-nowrap">{formatCurrency(expense.amount)}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(expense); setDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => duplicateMutation.mutate(expense.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(expense.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {expenses && expenses.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center px-4 text-sm">Page {page} of {expenses.totalPages}</span>
          <Button variant="outline" disabled={page >= expenses.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

function ExpenseForm({
  categories,
  expense,
  onSuccess,
}: {
  categories: Category[];
  expense: Expense | null;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? "");
  const [expenseDate, setExpenseDate] = useState(
    expense?.expenseDate ?? new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod ?? "");
  const [subcategory, setSubcategory] = useState(expense?.subcategory ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body = {
      title,
      amount: parseFloat(amount),
      categoryId,
      expenseDate,
      notes: notes || undefined,
      paymentMethod: paymentMethod || undefined,
      subcategory: subcategory || undefined,
    };
    try {
      if (expense) {
        await apiFetch(`/api/expenses/${expense.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/expenses", { method: "POST", body: JSON.stringify(body) });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Subcategory</Label>
        <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select value={paymentMethod || "none"} onValueChange={(v) => setPaymentMethod(v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : expense ? "Update" : "Create"}
      </Button>
    </form>
  );
}
