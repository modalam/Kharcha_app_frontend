import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kharcha Journal — Share & Install",
  description: "Track expenses, manage categories, and gain insights. Install Kharcha Journal on your phone or PC.",
  openGraph: {
    title: "Kharcha Journal — Personal Finance Tracker",
    description: "Track expenses, manage budgets, and gain insights.",
    url: "https://kharcha-frontend.pages.dev/share/",
    images: [{ url: "/og-share.png", width: 1200, height: 630, alt: "Kharcha Journal" }],
  },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
