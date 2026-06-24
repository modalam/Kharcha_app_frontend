"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { DailyJournal, PaginatedResponse } from "@/shared";
import { formatDate } from "@/shared";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { apiFetch } from "@/lib/api-client";

export default function JournalPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DailyJournal | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const { data, isLoading } = useQuery({
    queryKey: ["journals"],
    queryFn: () => apiFetch<PaginatedResponse<DailyJournal>>("/api/journals?limit=50"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/journals/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journals"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Journal</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Entry" : "New Journal Entry"}</DialogTitle>
            </DialogHeader>
            <JournalForm
              journal={editing}
              onSuccess={() => {
                setDialogOpen(false);
                setEditing(null);
                queryClient.invalidateQueries({ queryKey: ["journals"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today — {formatDate(today)}</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickJournal date={today} onSaved={() => queryClient.invalidateQueries({ queryKey: ["journals"] })} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Past Entries</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (data?.data ?? []).length === 0 ? (
          <p className="text-muted-foreground">No journal entries yet</p>
        ) : (
          (data?.data ?? []).map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{formatDate(entry.journalDate)}</p>
                    <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                      {entry.notes || "No notes"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(entry); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(entry.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function QuickJournal({ date, onSaved }: { date: string; onSaved: () => void }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/journals", {
        method: "POST",
        body: JSON.stringify({ journalDate: date, notes }),
      });
      setNotes("");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="What happened financially today? e.g. Received salary. Spent on groceries..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
      />
      <Button onClick={save} disabled={saving || !notes.trim()}>
        {saving ? "Saving..." : "Save Today's Entry"}
      </Button>
    </div>
  );
}

function JournalForm({
  journal,
  onSuccess,
}: {
  journal: DailyJournal | null;
  onSuccess: () => void;
}) {
  const [journalDate, setJournalDate] = useState(
    journal?.journalDate ?? new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(journal?.notes ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (journal) {
        await apiFetch(`/api/journals/${journal.id}`, {
          method: "PUT",
          body: JSON.stringify({ notes }),
        });
      } else {
        await apiFetch("/api/journals", {
          method: "POST",
          body: JSON.stringify({ journalDate, notes }),
        });
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!journal && (
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={journalDate} onChange={(e) => setJournalDate(e.target.value)} required />
        </div>
      )}
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : journal ? "Update" : "Create"}
      </Button>
    </form>
  );
}
