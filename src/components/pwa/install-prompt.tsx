"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

function shouldShowInstallPrompt(): boolean {
  if (process.env.NODE_ENV === "development") return false;
  if (typeof window !== "undefined" && isLocalDevHost()) return false;
  return true;
}

interface InstallPromptProps {
  variant?: "banner" | "card";
}

export function InstallPrompt({ variant = "banner" }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isInStandaloneMode());

    const onInstallable = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onInstallable);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!shouldShowInstallPrompt() || installed || dismissed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    if (isIos()) {
      setShowIosHelp(true);
    }
  };

  const showBanner = deferredPrompt || isIos();

  if (!showBanner) return null;

  if (variant === "card") {
    return (
      <div className="w-full max-w-lg rounded-2xl border border-green-200 bg-white p-5 shadow-lg">
        <h2 className="text-lg font-bold text-green-950">Install on your phone</h2>
        <p className="mt-1 text-sm text-green-700">
          Add Kharcha Journal to your home screen — open it like a normal app, no link needed every time.
        </p>

        {showIosHelp ? (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-green-800">
            <li>
              Tap the <strong>Share</strong> button in Safari (bottom on iPhone)
            </li>
            <li>
              Scroll and tap <strong>Add to Home Screen</strong>
            </li>
            <li>
              Tap <strong>Add</strong> — the app icon will appear on your home screen
            </li>
          </ol>
        ) : (
          <Button onClick={handleInstall} className="mt-4 w-full">
            <Download className="mr-2 h-4 w-4" />
            {deferredPrompt ? "Install App" : "How to Install (iPhone)"}
          </Button>
        )}

        <p className="mt-3 text-xs text-green-600">
          Secure install from kharcha-frontend.pages.dev only. No Play Store required.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-lg rounded-xl border border-green-200 bg-white p-4 shadow-xl sm:bottom-6 lg:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-green-950">Install Kharcha Journal</p>
          <p className="mt-0.5 text-xs text-green-700">
            Add to home screen for quick access like a real app.
          </p>
          {showIosHelp && (
            <p className="mt-2 text-xs text-green-800">
              Safari → Share <Share className="inline h-3 w-3" /> → Add to Home Screen
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-green-500 hover:text-green-800"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {!showIosHelp && (
        <Button onClick={handleInstall} size="sm" className="mt-3 w-full">
          <Download className="mr-2 h-4 w-4" />
          {deferredPrompt ? "Install App" : "Install (iPhone)"}
        </Button>
      )}
    </div>
  );
}
