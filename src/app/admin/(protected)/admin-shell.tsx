"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface AdminShellProps {
  userEmail: string;
  children: React.ReactNode;
}

export function AdminShell({ userEmail, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="bg-page-background text-foreground flex min-h-screen flex-col">
      {/* Top Bar */}
      <header className="border-border bg-page-background sticky top-0 z-20 flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="border-border text-foreground hover:bg-surface focus-visible:ring-foreground inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none md:hidden"
            aria-expanded={sidebarOpen}
            aria-label="Toggle admin sidebar"
          >
            {sidebarOpen ? "Close" : "Menu"}
          </button>
          <span className="font-heading text-foreground text-lg font-semibold tracking-wide sm:text-xl">
            Admin Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-foreground text-xs sm:text-sm">
            {userEmail}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="border-border bg-page-background hidden w-64 border-r p-4 md:block">
          <nav className="space-y-1" aria-label="Admin Navigation">
            <Link
              href="/admin"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === "/admin"
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/media"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === "/admin/media"
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Media
            </Link>
            <Link
              href="/admin/settings"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === "/admin/settings"
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Settings
            </Link>
          </nav>
        </aside>

        {/* Mobile Sidebar (Collapsible) */}
        {sidebarOpen && (
          <aside className="border-border bg-surface fixed inset-x-0 top-16 z-10 border-b p-4 md:hidden">
            <nav className="space-y-1" aria-label="Mobile Admin Navigation">
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/admin"
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/media"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/admin/media"
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Media
              </Link>
              <Link
                href="/admin/settings"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/admin/settings"
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Settings
              </Link>
            </nav>
          </aside>
        )}

        {/* Main Admin Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
