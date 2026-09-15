"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, MessageCircle, Send, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  fetchSupportSuggestions,
  sendSupportChat,
  sendSupportHandoff,
  type ChatResponse,
  type ChatSource,
} from "@/lib/chat-api";
import { cn } from "@/lib/utils";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  openHandoff?: boolean;
};

function chatSessionId(): string {
  const key = "kharcha-prelogin-chat-session";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

export function PreLoginAssistant() {
  const [open, setOpen] = useState(false);
  const [sid, setSid] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [handoffMode, setHandoffMode] = useState(false);
  const [handoffDraft, setHandoffDraft] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [handoffMessage, setHandoffMessage] = useState("");
  const [handoffOk, setHandoffOk] = useState("");
  const [handoffLoading, setHandoffLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSid(chatSessionId());
    fetchSupportSuggestions()
      .then((data) => setSuggestions(data.questions.slice(0, 4)))
      .catch(() => {
        setSuggestions([
          "What is Kharcha Journal?",
          "How do I create an account?",
          "How do I add an expense?",
        ]);
      });
  }, []);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages, loading, handoffMode]);

  async function ask(text: string) {
    const message = text.trim();
    if (!message || loading || !sid) return;

    setError("");
    setInput("");
    const userMsg: UiMessage = { id: crypto.randomUUID(), role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const priorHistory = messages.map(({ role, content }) => ({ role, content }));
      const result: ChatResponse = await sendSupportChat({
        message,
        sessionId: sid,
        history: priorHistory,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          openHandoff: result.openHandoff,
        },
      ]);
      if (result.openHandoff) {
        setHandoffDraft("");
        setHandoffMessage("");
        setHandoffMode(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat request failed");
      setMessages((prev) => prev.filter((item) => item.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  async function onHandoffSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setHandoffOk("");
    if (!name.trim() || !email.trim() || !handoffMessage.trim()) {
      setError("Name, email, and message are required.");
      return;
    }
    setHandoffLoading(true);
    try {
      const result = await sendSupportHandoff({
        sessionId: sid,
        name: name.trim(),
        email: email.trim(),
        message: handoffMessage.trim(),
      });
      setHandoffOk(result.notice);
      setHandoffMode(false);
      setName("");
      setEmail("");
      setHandoffMessage("");
      setHandoffDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the message");
    } finally {
      setHandoffLoading(false);
    }
  }

  function openHandoffForm(draft = "") {
    setHandoffDraft(draft);
    setHandoffMessage(draft);
    setHandoffMode(true);
    setOpen(true);
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className={cn(
            "pointer-events-auto flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow-xl",
            "h-[min(70vh,32rem)]"
          )}
        >
          <div className="flex items-start justify-between gap-2 border-b bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="text-sm font-semibold">Kharcha Assistant</p>
              <p className="text-xs opacity-90">AI help before you sign in · not a person</p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 hover:bg-primary-foreground/15"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {handoffMode ? (
            <form onSubmit={onHandoffSubmit} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-xs text-muted-foreground">
                Leave your name and email so we can reply. Chat alone does not create a ticket.
              </p>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
              />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={200}
              />
              <Textarea
                placeholder="How can we help?"
                value={handoffMessage}
                onChange={(e) => setHandoffMessage(e.target.value)}
                required
                maxLength={4000}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="mt-auto flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setHandoffMode(false)}>
                  Back to chat
                </Button>
                <Button type="submit" className="flex-1" disabled={handoffLoading}>
                  {handoffLoading ? "Saving…" : "Send"}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {messages.length === 0 && (
                  <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                    Ask how Kharcha works — signup, expenses, reports, and more. We only use public help
                    docs.
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-xs",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "border bg-card text-card-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.openHandoff && (
                        <button
                          type="button"
                          className="mt-2 font-medium underline"
                          onClick={() => openHandoffForm("")}
                        >
                          Open contact form
                        </button>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                        <UserRound className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && <p className="text-xs text-muted-foreground">Thinking…</p>}
                {handoffOk && <p className="text-xs text-primary">{handoffOk}</p>}
                <div ref={bottomRef} />
              </div>

              {suggestions.length > 0 && messages.length === 0 && (
                <div className="flex gap-1.5 overflow-x-auto border-t px-3 py-2">
                  {suggestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      disabled={loading}
                      className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] hover:bg-accent disabled:opacity-50"
                      onClick={() => void ask(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}

              {error && <p className="px-3 pb-1 text-xs text-destructive">{error}</p>}

              <form onSubmit={onSubmit} className="flex gap-2 border-t p-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Kharcha…"
                  disabled={loading}
                  maxLength={2000}
                  className="h-9 text-xs"
                  aria-label="Ask the assistant"
                />
                <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <button
                type="button"
                className="border-t px-3 py-2 text-left text-[11px] text-muted-foreground hover:bg-accent"
                onClick={() => openHandoffForm("")}
              >
                Need a human? Leave name + email
              </button>
            </>
          )}
        </div>
      )}

      <div className="pointer-events-auto group relative">
        {!open && (
          <span
            className={cn(
              "pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap",
              "rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-md",
              "opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            )}
            aria-hidden
          >
            AI Kharcha Assistant
          </span>
        )}
        <Button
          type="button"
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          aria-label={open ? "Close Kharcha assistant" : "Open AI Kharcha Assistant"}
          title={open ? undefined : "AI Kharcha Assistant"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
}
