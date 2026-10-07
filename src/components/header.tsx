"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/config/site";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";

interface HeaderProps {
  businessName?: string;
  logoUrl?: string | null;
  logoAlt?: string;
  whatsappNumber?: string;
}

export function Header({
  businessName = siteConfig.name,
  logoUrl,
  logoAlt,
  whatsappNumber,
}: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const whatsAppLink = whatsappNumber
    ? buildWhatsAppLink({
        phoneNumber: whatsappNumber,
        greeting: `Hello ${businessName}! I would like to book an appointment / make an enquiry.`,
      })
    : "";

  return (
    <header className="border-border bg-page-background sticky top-0 z-30 border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo & Business Name */}
        <Link
          href="/"
          className="font-heading text-foreground flex items-center gap-3 text-lg font-semibold tracking-wide sm:text-2xl"
        >
          {logoUrl && (
            <div className="relative h-10 w-10 flex-none overflow-hidden rounded-full border border-border/80 bg-white shadow-xs sm:h-11 sm:w-11">
              <Image
                src={logoUrl}
                alt={logoAlt || businessName}
                fill
                sizes="44px"
                className="rounded-full object-cover"
                priority
              />
            </div>
          )}
          <span>{businessName}</span>
        </Link>

        {/* Desktop Navigation & Actions */}
        <div className="hidden md:flex md:items-center md:gap-8">
          <nav className="flex items-center gap-6" aria-label="Main Navigation">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground hover:text-foreground/75 text-sm font-medium transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Primary WhatsApp CTA button when number exists */}
          {whatsAppLink && (
            <Link
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              WhatsApp
            </Link>
          )}
        </div>

        {/* Mobile Menu & Action Controls */}
        <div className="flex items-center gap-3 md:hidden">
          {whatsAppLink && (
            <Link
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold tracking-wider uppercase"
              aria-label="Chat on WhatsApp"
            >
              WhatsApp
            </Link>
          )}

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

      {/* Mobile Navigation Dropdown */}
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
                  className="text-foreground hover:bg-card-surface block rounded px-3 py-2 text-sm font-medium"
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
