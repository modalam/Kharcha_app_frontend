"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Silent fail — app still works without PWA install
    });
  }, []);

  return null;
}
