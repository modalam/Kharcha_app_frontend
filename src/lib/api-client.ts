const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & { skipAuth?: boolean };

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<void> | null = null;

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== "undefined") {
    if (access) localStorage.setItem("accessToken", access);
    else localStorage.removeItem("accessToken");
    if (refresh) localStorage.setItem("refreshToken", refresh);
    else localStorage.removeItem("refreshToken");
  }
}

export function loadTokens() {
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("accessToken");
    refreshToken = localStorage.getItem("refreshToken");
  }
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<void> {
  if (!refreshToken) throw new ApiError("No refresh token", 401);
  const res = await fetch(`${API_URL}/api/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    setTokens(null, null);
    throw new ApiError("Session expired", 401);
  }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...init } = options;

  if (!skipAuth && !accessToken && typeof window !== "undefined") {
    loadTokens();
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && !skipAuth && refreshToken) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    try {
      await refreshPromise;
      headers.set("Authorization", `Bearer ${accessToken}`);
      res = await fetch(`${API_URL}${path}`, { ...init, headers });
    } catch {
      setTokens(null, null);
      if (typeof window !== "undefined") {
        const { useAuthStore } = await import("@/stores/auth");
        useAuthStore.getState().clearAuth();
      }
      throw new ApiError("Session expired", 401);
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(err.message ?? "Request failed", res.status, err.error);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }
  return res as unknown as T;
}

export async function apiDownload(path: string): Promise<Blob> {
  const headers = new Headers();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new ApiError("Download failed", res.status);
  return res.blob();
}

export { API_URL };
