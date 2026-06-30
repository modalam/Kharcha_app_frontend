import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kharcha Journal",
  description: "Personal Finance Journal - Track expenses, manage categories, and gain insights",
  applicationName: "Kharcha Journal",
  appleWebApp: {
    capable: true,
    title: "Kharcha Journal",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <RegisterServiceWorker />
        </Providers>
      </body>
    </html>
  );
}
