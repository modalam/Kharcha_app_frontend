"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { apiFetch } from "@/lib/api-client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/categories", label: "Categories", icon: FolderOpen },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, clearAuth } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // ignore
      }
    }
    clearAuth();
    window.location.href = "/login";
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <Link href="/dashboard" className="shrink-0 text-lg font-bold text-primary">
            Kharcha Journal
          </Link>
          <div className="flex min-w-0 items-center gap-1">
            <span className="max-w-[100px] truncate text-sm text-muted-foreground sm:max-w-[200px]">
              {user?.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="space-y-1 border-t p-4">
            <div className="mb-3 border-b pb-3">
              <p className="truncate font-medium">{user?.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <NavLinks onClick={() => setMobileOpen(false)} />
            <div className="border-t pt-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </nav>
        )}
      </header>

      <div className="flex">
        <aside className="hidden w-64 shrink-0 border-r lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="flex h-14 items-center border-b px-6">
              <Link href="/dashboard" className="text-lg font-bold text-primary">
                Kharcha Journal
              </Link>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              <NavLinks />
            </nav>
            <div className="border-t p-4 space-y-2">
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="hidden h-14 items-center justify-end gap-2 border-b px-6 lg:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <span className="text-sm text-muted-foreground">{user?.name}</span>
          </div>
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
        <div className="flex justify-around px-1 py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const label = item.href === "/analytics" ? "Stats" : item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-1 text-[10px] leading-tight sm:text-xs",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate text-center">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
