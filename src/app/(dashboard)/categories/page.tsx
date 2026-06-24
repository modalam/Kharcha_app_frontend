"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Category } from "@/shared";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CategoryIcon, getIconColorForBackground } from "@/components/category-icon";
import { apiFetch } from "@/lib/api-client";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/api/categories/list"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch("/api/categories/delete", { method: "POST", body: JSON.stringify({ id }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={editing}
              onSuccess={() => {
                setDialogOpen(false);
                setEditing(null);
                queryClient.invalidateQueries({ queryKey: ["categories"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(categories ?? []).map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: cat.color ?? "#6b7280",
                    color: getIconColorForBackground(cat.color ?? "#6b7280"),
                  }}
                >
                  <CategoryIcon icon={cat.icon} className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cat.name}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(cat); setDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  onSuccess,
}: {
  category: Category | null;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [color, setColor] = useState(category?.color ?? "#16a34a");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const body = { name, icon, color };
    try {
      if (category) {
        await apiFetch("/api/categories/update", {
          method: "POST",
          body: JSON.stringify({ id: category.id, ...body }),
        });
      } else {
        await apiFetch("/api/categories/create", { method: "POST", body: JSON.stringify(body) });
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex items-center gap-3">
          <Input
            className="flex-1"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="e.g. Scissors or apple"
          />
          {icon && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: color,
                color: getIconColorForBackground(color),
              }}
            >
              <CategoryIcon icon={icon} className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : category ? "Update" : "Create"}
      </Button>
    </form>
  );
}
