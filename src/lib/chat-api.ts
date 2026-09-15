const CHAT_API_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL ?? "https://ai-chatboat-api.modassiralam92.workers.dev";

export class ChatApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

export type ChatSource = {
  id: string;
  title: string;
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResponse = {
  answer: string;
  sources: ChatSource[];
  refused: boolean;
  usedModel: boolean;
  openHandoff?: boolean;
};

async function chatFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${CHAT_API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { error?: string };
      if (typeof data.error === "string") message = data.error;
    } catch {
      /* ignore */
    }
    throw new ChatApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export function sendSupportChat(input: {
  message: string;
  sessionId: string;
  history: ChatTurn[];
}) {
  return chatFetch<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      history: input.history.slice(-12),
    }),
  });
}

export function fetchSupportSuggestions() {
  return chatFetch<{ questions: string[] }>("/api/chat/suggestions");
}

export function sendSupportHandoff(input: {
  sessionId: string;
  name: string;
  email: string;
  message: string;
}) {
  return chatFetch<{ ok: boolean; notice: string }>("/api/handoff", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export { CHAT_API_URL };
