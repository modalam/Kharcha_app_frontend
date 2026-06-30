"use client";

import Image from "next/image";
import { Download, ExternalLink, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/pwa/install-prompt";

const APP_URL = "https://kharcha-frontend.pages.dev/";

export default function SharePage() {
  const openApp = () => {
    window.location.href = APP_URL;
  };

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = "/og-share.png";
    link.download = "kharcha-journal.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-950 to-green-700 px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
          <Wallet className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold">Kharcha Journal</span>
      </div>

      <button
        type="button"
        onClick={openApp}
        className="group w-full max-w-lg overflow-hidden rounded-2xl border border-green-600/40 bg-white shadow-2xl transition-transform hover:scale-[1.01] active:scale-[0.99]"
        aria-label="Open Kharcha Journal app"
      >
        <Image
          src="/og-share.png"
          alt="Kharcha Journal — Track expenses, manage budgets, gain insights"
          width={1200}
          height={630}
          className="h-auto w-full"
          priority
        />
        <div className="bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-800 group-hover:bg-green-100">
          Tap image to open app →
        </div>
      </button>

      <div className="mt-8 w-full max-w-lg">
        <InstallPrompt variant="card" />
      </div>

      <div className="mt-6 flex w-full max-w-lg flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <div className="rounded-xl bg-white p-3 shadow-lg">
          <Image
            src="/qr-code.png"
            alt="QR code to open Kharcha Journal"
            width={160}
            height={160}
            className="rounded-lg"
          />
          <p className="mt-2 text-center text-xs text-green-800">Scan to open</p>
        </div>

        <div className="flex flex-col gap-3 sm:items-start">
          <Button onClick={openApp} className="w-full sm:w-auto">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open App
          </Button>
          <Button
            variant="outline"
            onClick={downloadImage}
            className="w-full border-green-300 bg-white sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </Button>
          <p className="max-w-xs text-center text-xs text-green-200 sm:text-left">
            Share this page link or download the image. Scan the QR code on this page to open the app.
          </p>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-green-300">
        <button type="button" onClick={openApp} className="underline hover:text-white">
          kharcha-frontend.pages.dev
        </button>
      </p>
    </div>
  );
}
