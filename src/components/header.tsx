"use client";

import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="border-border bg-page-background border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-heading text-foreground text-xl font-semibold tracking-wide sm:text-2xl"
        >
          {siteConfig.name}
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex md:items-center md:gap-6"
          aria-label="Main Navigation"
        >
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground text-sm font-medium hover:opacity-80"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="border-border text-foreground hover:bg-surface focus-visible:ring-foreground inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile Navigation List (No animations) */}
      {isOpen && (
        <nav
          className="border-border bg-surface border-t px-4 py-3 md:hidden"
          aria-label="Mobile Navigation"
        >
          <ul className="flex flex-col gap-2">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-foreground hover:bg-card-surface block rounded px-2 py-1.5 text-sm font-medium"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
