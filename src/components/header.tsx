"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/config/site";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { HeaderCartIcon } from "@/components/header-cart-icon";
import { m } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ScrollProgressBar } from "@/components/public/scroll-progress";

interface HeaderProps {
  businessName?: string;
  logoUrl?: string | null;
  logoAlt?: string;
  whatsappNumber?: string;
  acceptOrders?: boolean;
  hasBlog?: boolean;
}

export function Header({
  businessName = siteConfig.name,
  logoUrl,
  logoAlt,
  whatsappNumber,
  acceptOrders = true,
  hasBlog = false,
}: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const toggleBtnRef = React.useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        toggleBtnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const whatsAppLink = whatsappNumber
    ? buildWhatsAppLink({
        phoneNumber: whatsappNumber,
        greeting: `Hello ${businessName}! I would like to book an appointment / make an enquiry.`,
      })
    : "";

  const navItems = React.useMemo(() => {
    const items = [...siteConfig.nav];
    if (hasBlog && !items.some((i) => i.href === "/blog")) {
      const aboutIdx = items.findIndex((i) => i.href === "/about");
      if (aboutIdx !== -1) {
        items.splice(aboutIdx, 0, { title: "Blog", href: "/blog" });
      } else {
        items.push({ title: "Blog", href: "/blog" });
      }
    }
    return items;
  }, [hasBlog]);

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-all duration-300 ${
        isScrolled
          ? "border-[#E5DFD7] bg-[#FAF8F5]/98 shadow-xs backdrop-blur-lg"
          : "border-[#E5DFD7]/60 bg-[#FAF8F5]/90 backdrop-blur-md"
      }`}
    >
      {/* Editorial animated gold hairline drawing left-to-right on mount */}
      {!reducedMotion && (
        <m.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[1px] origin-left bg-[#C5A059]/40"
        />
      )}
      {/* 2px antique gold scroll progress indicator */}
      <ScrollProgressBar className="absolute -bottom-[2px] left-0 right-0" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo & Business Name */}
        <Link
          href="/"
          className="font-heading flex items-center gap-3 text-lg font-semibold tracking-wide text-[#1C1917] sm:text-2xl"
        >
          {logoUrl && (
            <div className="relative h-10 w-10 flex-none overflow-hidden rounded-full border border-[#C5A059]/40 bg-white shadow-xs sm:h-11 sm:w-11">
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
        <div className="hidden md:flex md:items-center md:gap-7">
          <nav className="flex items-center gap-6" aria-label="Main Navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative text-sm font-medium text-[#1C1917]/85 transition-colors hover:text-[#8C2524]"
              >
                <span>{item.title}</span>
                <span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-[#8C2524] transition-all duration-200 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <HeaderCartIcon acceptOrders={acceptOrders} />

            {/* Primary WhatsApp CTA button when number exists */}
            {whatsAppLink && (
              <Link
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-[#8C2524] px-4 py-2 text-xs font-semibold tracking-wider text-white uppercase shadow-xs transition-colors hover:bg-[#731E1D] focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
              >
                WhatsApp
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu & Action Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <HeaderCartIcon acceptOrders={acceptOrders} />

          {whatsAppLink && (
            <Link
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-[#8C2524] px-3 py-1.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-[#731E1D]"
              aria-label="Chat on WhatsApp"
            >
              WhatsApp
            </Link>
          )}

          <button
            ref={toggleBtnRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-md border border-[#E5DFD7] bg-white px-3 py-1.5 text-sm font-medium text-[#1C1917] hover:bg-[#F4ECE4] focus-visible:ring-2 focus-visible:ring-[#8C2524] focus-visible:outline-none"
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
          className="border-t border-[#E5DFD7] bg-[#FAF8F5] px-4 py-3 shadow-md md:hidden"
          aria-label="Mobile Navigation"
        >
          <ul className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-[#1C1917] transition-colors hover:bg-[#F4ECE4] hover:text-[#8C2524]"
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
