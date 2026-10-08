"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface AdminShellProps {
  userEmail: string;
  paymentSubmittedCount?: number;
  children: React.ReactNode;
}

export function AdminShell({
  userEmail,
  paymentSubmittedCount = 0,
  children,
}: AdminShellProps) {
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
              href="/admin/orders"
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                pathname?.startsWith("/admin/orders")
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              <span>Orders</span>
              {paymentSubmittedCount > 0 && (
                <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-bold leading-none">
                  {paymentSubmittedCount}
                </span>
              )}
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
            <Link
              href="/admin/services"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === "/admin/services"
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Services
            </Link>
            <Link
              href="/admin/product-categories"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === "/admin/product-categories"
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Product Categories
            </Link>
            <Link
              href="/admin/products"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === "/admin/products"
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Products
            </Link>
            <Link
              href="/admin/gallery"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === "/admin/gallery"
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Gallery
            </Link>
            <Link
              href="/admin/content"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === "/admin/content"
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Content
            </Link>
            <Link
              href="/admin/legal"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === "/admin/legal"
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Legal Pages
            </Link>
            <Link
              href="/admin/blog"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname?.startsWith("/admin/blog")
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Blog
            </Link>
            <Link
              href="/admin/seo"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname?.startsWith("/admin/seo")
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              SEO
            </Link>
            <Link
              href="/admin/redirects"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname?.startsWith("/admin/redirects")
                  ? "bg-surface text-foreground font-semibold"
                  : "text-foreground hover:bg-surface"
              }`}
            >
              Redirects
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
                href="/admin/orders"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                  pathname?.startsWith("/admin/orders")
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                <span>Orders</span>
                {paymentSubmittedCount > 0 && (
                  <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-bold leading-none">
                    {paymentSubmittedCount}
                  </span>
                )}
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
              <Link
                href="/admin/services"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/admin/services"
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Services
              </Link>
              <Link
                href="/admin/product-categories"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/admin/product-categories"
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Product Categories
              </Link>
              <Link
                href="/admin/products"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/admin/products"
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Products
              </Link>
              <Link
                href="/admin/gallery"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/admin/gallery"
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Gallery
              </Link>
              <Link
                href="/admin/content"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/admin/content"
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Content
              </Link>
              <Link
                href="/admin/legal"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/admin/legal"
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Legal Pages
              </Link>
              <Link
                href="/admin/blog"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname?.startsWith("/admin/blog")
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Blog
              </Link>
              <Link
                href="/admin/seo"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname?.startsWith("/admin/seo")
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                SEO
              </Link>
              <Link
                href="/admin/redirects"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  pathname?.startsWith("/admin/redirects")
                    ? "bg-card-surface text-foreground font-semibold"
                    : "text-foreground hover:bg-card-surface"
                }`}
              >
                Redirects
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
