"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { formatCurrency, todayLocalISO, PAYMENT_METHODS, type Category, type Expense, type PaginatedResponse } from "@/shared";
import { Copy, Pencil, Plus, Trash2, Upload } from "lucide-react";
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
  const [importError, setImportError] = useState("");
  const [importSummary, setImportSummary] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const bulkImportMutation = useMutation({
    mutationFn: (items: Array<{
      title: string;
      amount: number;
      categoryId: string;
      expenseDate: string;
      subcategory?: string;
      notes?: string;
      paymentMethod?: string;
    }>) => apiFetch<{ count: number }>("/api/expenses/bulk", {
      method: "POST",
      body: JSON.stringify({ expenses: items }),
    }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setImportSummary(`Imported ${result.count} expenses successfully.`);
      setImportError("");
    },
    onError: (err) => {
      setImportError(err instanceof Error ? err.message : "Import failed");
      setImportSummary("");
    },
  });

  const handleImportClick = () => {
    setImportError("");
    setImportSummary("");
    fileInputRef.current?.click();
  };

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parseResult = parseExpenseCsv(text, categories ?? []);
      if (parseResult.errors.length > 0) {
        setImportError(parseResult.errors.slice(0, 8).join(" "));
        setImportSummary("");
        return;
      }
      await bulkImportMutation.mutateAsync(parseResult.rows);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to read file");
      setImportSummary("");
    } finally {
      event.target.value = "";
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleCsvImport}
          />
          <Button
            variant="outline"
            className="h-11 w-full sm:w-auto"
            onClick={handleImportClick}
            disabled={bulkImportMutation.isPending}
          >
            <Upload className="h-4 w-4" />
            {bulkImportMutation.isPending ? "Importing..." : "Import CSV"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="h-11 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
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
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground sm:hidden">
        CSV needs: title, amount, date, category. Optional: subcategory, paymentMethod, notes.
      </p>
      <p className="hidden text-xs text-muted-foreground sm:block">
        CSV headers: title, amount, date, category, subcategory, paymentMethod, notes
      </p>
      {importError && <p className="break-words text-sm text-destructive">{importError}</p>}
      {importSummary && <p className="break-words text-sm text-emerald-600">{importSummary}</p>}

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

type ParsedCsvResult = {
  rows: Array<{
    title: string;
    amount: number;
    categoryId: string;
    expenseDate: string;
    subcategory?: string;
    notes?: string;
    paymentMethod?: string;
  }>;
  errors: string[];
};

function parseExpenseCsv(rawCsv: string, categories: Category[]): ParsedCsvResult {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must include a header and at least one row."] };
  }

  const headers = splitCsvLine(lines[0]).map((header) => normalizeHeader(header));
  const categoryByName = new Map(categories.map((category) => [category.name.toLowerCase(), category.id]));
  const rows: ParsedCsvResult["rows"] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i]);
    const row = Object.fromEntries(headers.map((header, idx) => [header, (values[idx] ?? "").trim()]));
    const lineNumber = i + 1;
    const title = row.title;
    const amount = Number(row.amount);
    const expenseDate = normalizeDate(row.date || row.expensedate);
    const categoryName = (row.category || "").toLowerCase();
    const categoryId = categoryByName.get(categoryName);
    const paymentMethod = row.paymentmethod;

    if (!title) errors.push(`Line ${lineNumber}: title is required.`);
    if (!Number.isFinite(amount) || amount <= 0) errors.push(`Line ${lineNumber}: amount must be a positive number.`);
    if (!expenseDate) errors.push(`Line ${lineNumber}: date must be in YYYY-MM-DD or DD/MM/YYYY format.`);
    if (!categoryId) errors.push(`Line ${lineNumber}: category "${row.category || ""}" not found.`);
    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod as (typeof PAYMENT_METHODS)[number])) {
      errors.push(`Line ${lineNumber}: paymentMethod must be one of ${PAYMENT_METHODS.join(", ")}.`);
    }

    if (!title || !categoryId || !expenseDate || !Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    rows.push({
      title,
      amount,
      categoryId,
      expenseDate,
      subcategory: row.subcategory || undefined,
      notes: row.notes || undefined,
      paymentMethod: paymentMethod || undefined,
    });
  }

  if (rows.length > 500) {
    errors.push("A single import supports up to 500 rows.");
  }

  return { rows: rows.slice(0, 500), errors };
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[\s_]+/g, "");
}

function normalizeDate(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
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
    expense?.expenseDate ?? todayLocalISO()
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
