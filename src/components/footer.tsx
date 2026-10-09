import Link from "next/link";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import type { BusinessSettings, SocialSettings } from "@/types/settings";

interface FooterProps {
  business?: BusinessSettings;
  social?: SocialSettings;
  legalPages?: Array<{ slug: string; title: string }>;
}

function formatTime12h(timeStr?: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

export function Footer({ business, social, legalPages = [] }: FooterProps) {
  const currentYear = 2026;
  const name = business?.business_name || "Nandhini Makeup & Jewellery";

  // Opening hours
  const weekday = business?.opening_hours?.monday;
  const sunday = business?.opening_hours?.sunday;

  const instagramPrimary =
    social?.instagram_primary ||
    "https://www.instagram.com/nandhini__makeupartist/";
  const instagramSecondary =
    social?.instagram_secondary ||
    "https://www.instagram.com/nandhu_accessorie/";
  const fullAddress =
    business?.full_address || "Fairlands, Salem, Tamil Nadu – 636016, India";
  const mapsLink =
    business?.google_maps_link ||
    "https://maps.app.goo.gl/qH9srr73zGcWjFNe9";

  const whatsAppLink =
    business?.whatsapp_number || "+917010847631"
      ? buildWhatsAppLink({
          phoneNumber: business?.whatsapp_number || "+917010847631",
          greeting: `Hello ${name}! I would like to make an enquiry regarding bridal makeup and jewellery:`,
        })
      : "";

  return (
    <footer className="relative border-t border-[#C5A059]/40 bg-gradient-to-b from-[#FAF8F5] via-[#F4ECE4]/50 to-[#FAF8F5] text-sm text-[#1C1917] overflow-hidden">
      {/* Decorative top gold hairline glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/60 to-transparent"
      />

      {/* Pre-footer Atelier Highlights Bar */}
      <div className="border-b border-[#E5DFD7]/80 bg-white/60 py-6 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-[#C5A059]/40 bg-[#FAF8F5] text-[#8C2524] shadow-2xs">
              <SparklesIcon className="h-5 w-5 text-[#C5A059]" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-[#8C2524]">
                Salem Bridal Atelier &amp; Curated Jewellery Rental
              </p>
              <p className="text-xs text-[#78716C]">
                Serving brides across Salem, Erode, Namakkal, Dharmapuri &amp; all South India.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {whatsAppLink && (
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] hover:bg-[#166534] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all hover:shadow-xs"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                <span>WhatsApp Enquiry</span>
              </a>
            )}

            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C5A059]/60 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#8C2524] transition-all hover:bg-[#FAF8F5] hover:border-[#8C2524]"
            >
              <LocationIcon className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>Studio &amp; Location</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main 4-Column Footer Content */}
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Column 1: Brand Info & Google Rating (4 cols) */}
          <div className="space-y-4 lg:col-span-4">
            <Link href="/" className="inline-block">
              <h3 className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-heading text-2xl font-bold tracking-tight text-[#8C2524] sm:text-3xl">
                  Nandhini
                </span>
                <span className="flex items-center gap-1.5 font-heading text-base font-semibold text-[#1C1917] sm:text-lg">
                  <span className="text-xs text-[#C5A059] select-none">✦</span>
                  <span>Makeup</span>
                  <span className="font-serif italic text-[#C5A059]">&amp;</span>
                  <span>Jewellery</span>
                </span>
              </h3>
            </Link>

            <p className="text-xs leading-relaxed text-[#57534E] sm:text-sm">
              {business?.tagline ||
                "Bridal Makeup Artistry & Curated Antique Jewellery Rental in Salem. Crafting timeless South Indian brides with HD glass-skin perfection."}
            </p>

            {/* Verified Google Badge */}
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#C5A059]/40 bg-white/80 px-3.5 py-2 shadow-2xs">
              <div className="flex text-amber-500">
                <StarIcon className="h-3.5 w-3.5 fill-current" />
                <StarIcon className="h-3.5 w-3.5 fill-current" />
                <StarIcon className="h-3.5 w-3.5 fill-current" />
                <StarIcon className="h-3.5 w-3.5 fill-current" />
                <StarIcon className="h-3.5 w-3.5 fill-current" />
              </div>
              <span className="text-xs font-semibold text-[#1C1917]">
                4.9 ★ Rating on Google
              </span>
            </div>

            {/* Direct contact line */}
            <div className="space-y-1.5 pt-1 text-xs text-[#57534E]">
              {business?.phone && (
                <p className="flex items-center gap-2">
                  <PhoneIcon className="h-3.5 w-3.5 text-[#8C2524] flex-none" />
                  <a
                    href={`tel:${business.phone}`}
                    className="hover:text-[#8C2524] font-medium transition-colors"
                  >
                    {business.phone}
                  </a>
                </p>
              )}
              {business?.email && (
                <p className="flex items-center gap-2">
                  <MailIcon className="h-3.5 w-3.5 text-[#8C2524] flex-none" />
                  <a
                    href={`mailto:${business.email}`}
                    className="hover:text-[#8C2524] font-medium transition-colors break-all"
                  >
                    {business.email}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Column 2: Bridal Collections & Services (3 cols) */}
          <div className="space-y-3 lg:col-span-3">
            <h4 className="font-heading text-sm font-semibold tracking-wider text-[#8C2524] uppercase">
              Bridal Artistry &amp; Looks
            </h4>
            <ul className="space-y-2 text-xs text-[#57534E]">
              <li>
                <Link
                  href="/services"
                  className="hover:text-[#8C2524] transition-colors hover:underline flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-[#C5A059]">✦</span>
                  <span>Muhurtham Bridal Makeup</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-[#8C2524] transition-colors hover:underline flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-[#C5A059]">✦</span>
                  <span>Reception Glass-Skin Glow</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-[#8C2524] transition-colors hover:underline flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-[#C5A059]">✦</span>
                  <span>Silk Saree Pleating &amp; Draping</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/jewellery"
                  className="hover:text-[#8C2524] transition-colors hover:underline flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-[#C5A059]">✦</span>
                  <span>Antique Nagas Temple Jewellery</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/jewellery"
                  className="hover:text-[#8C2524] transition-colors hover:underline flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-[#C5A059]">✦</span>
                  <span>Victorian &amp; AD Diamond Sets</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="hover:text-[#8C2524] transition-colors hover:underline flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-[#C5A059]">✦</span>
                  <span>Real Transformations Gallery</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Studio Location & Hours (3 cols) */}
          <div className="space-y-3 lg:col-span-3">
            <h4 className="font-heading text-sm font-semibold tracking-wider text-[#8C2524] uppercase">
              Fairlands Studio
            </h4>
            <div className="space-y-2 text-xs text-[#57534E]">
              <p className="flex items-start gap-2 leading-relaxed">
                <LocationIcon className="h-4 w-4 text-[#8C2524] flex-none mt-0.5" />
                <span>
                  {business?.street_address ? `${business.street_address}, ` : ""}
                  {fullAddress}
                </span>
              </p>

              <div className="pt-1">
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#8C2524] hover:underline"
                >
                  <span>Open in Google Maps</span>
                  <span className="text-[10px] text-[#C5A059]">↗</span>
                </a>
              </div>

              {/* Opening Hours Schedule */}
              <div className="rounded-xl border border-[#E5DFD7]/90 bg-white/80 p-3 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#1C1917]">
                  <ClockIcon className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>Studio Hours</span>
                </div>
                <p className="flex items-center justify-between text-[11px]">
                  <span>Mon – Sat:</span>
                  <span className="font-mono font-medium text-[#1C1917]">
                    {weekday && !weekday.isClosed
                      ? `${formatTime12h(weekday.openTime)} – ${formatTime12h(weekday.closeTime)}`
                      : "09:00 AM – 08:00 PM"}
                  </span>
                </p>
                <p className="flex items-center justify-between text-[11px]">
                  <span>Sunday:</span>
                  <span className="italic text-[#8C2524]">
                    {sunday?.isClosed ? "Closed / By Appointment" : "By Appointment"}
                  </span>
                </p>
                <p className="text-[10px] text-[#78716C] pt-1 border-t border-[#E5DFD7]/60 leading-tight">
                  * 3:00 AM Muhurtham slots available via booking.
                </p>
              </div>
            </div>
          </div>

          {/* Column 4: Social Lookbooks & Quick Connect (2 cols) */}
          <div className="space-y-3 lg:col-span-2">
            <h4 className="font-heading text-sm font-semibold tracking-wider text-[#8C2524] uppercase">
              Social Lookbooks
            </h4>
            <div className="flex flex-col gap-2 text-xs font-medium">
              <a
                href={instagramPrimary}
                target="_blank"
                rel="noopener noreferrer"
                className="border-[#E5DFD7] bg-white hover:bg-[#FAF8F5] text-[#1C1917] hover:text-[#8C2524] hover:border-[#C5A059]/60 group flex items-center gap-2 rounded-lg border px-3 py-2 transition-all shadow-2xs hover:shadow-xs"
                title="Follow Nandhini Makeup Artist on Instagram"
              >
                <InstagramIcon className="h-4 w-4 flex-none text-[#8C2524] transition-transform group-hover:scale-110" />
                <div className="overflow-hidden">
                  <p className="truncate text-[11px] font-semibold">@nandhini__makeupartist</p>
                  <p className="text-[9.5px] text-[#78716C]">Bridal Makeup</p>
                </div>
              </a>

              <a
                href={instagramSecondary}
                target="_blank"
                rel="noopener noreferrer"
                className="border-[#E5DFD7] bg-white hover:bg-[#FAF8F5] text-[#1C1917] hover:text-[#8C2524] hover:border-[#C5A059]/60 group flex items-center gap-2 rounded-lg border px-3 py-2 transition-all shadow-2xs hover:shadow-xs"
                title="Follow Nandhu Jewellery on Instagram"
              >
                <InstagramIcon className="h-4 w-4 flex-none text-[#C5A059] transition-transform group-hover:scale-110" />
                <div className="overflow-hidden">
                  <p className="truncate text-[11px] font-semibold">@nandhu_accessorie</p>
                  <p className="text-[9.5px] text-[#78716C]">Temple Jewellery</p>
                </div>
              </a>

              {whatsAppLink && (
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-[#15803D]/30 bg-[#15803D]/10 hover:bg-[#15803D] text-[#15803D] hover:text-white group flex items-center gap-2 rounded-lg border px-3 py-2 transition-all shadow-2xs"
                  title="Chat directly on WhatsApp"
                >
                  <WhatsAppIcon className="h-4 w-4 flex-none transition-transform group-hover:scale-110" />
                  <span className="truncate text-[11px] font-semibold">Chat on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Quick Navigation Directory Row */}
        <div className="border-t border-[#E5DFD7]/80 mt-10 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#57534E]">
            <Link href="/" className="hover:text-[#8C2524] transition-colors">
              Home
            </Link>
            <Link href="/services" className="hover:text-[#8C2524] transition-colors">
              Services
            </Link>
            <Link href="/jewellery" className="hover:text-[#8C2524] transition-colors">
              Jewellery
            </Link>
            <Link href="/gallery" className="hover:text-[#8C2524] transition-colors">
              Gallery
            </Link>
            <Link href="/about" className="hover:text-[#8C2524] transition-colors">
              About
            </Link>
            <Link href="/reviews" className="hover:text-[#8C2524] transition-colors">
              Reviews
            </Link>
            <Link href="/blog" className="hover:text-[#8C2524] transition-colors">
              Blog
            </Link>
            <Link href="/faq" className="hover:text-[#8C2524] transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-[#8C2524] transition-colors">
              Contact &amp; Studio Map
            </Link>
          </div>
        </div>

        {/* Legal Pages & Copyright */}
        <div className="border-t border-[#E5DFD7]/60 mt-6 pt-5 flex flex-col items-center justify-between gap-3 text-xs text-[#78716C] sm:flex-row">
          <p>
            © {currentYear} {name}. All rights reserved. Handcrafted in Salem, Tamil Nadu.
          </p>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            {legalPages.map((lp) => (
              <Link
                key={lp.slug}
                href={
                  lp.slug === "shipping-and-returns"
                    ? "/shipping-returns"
                    : `/${lp.slug}`
                }
                className="hover:text-[#1C1917] transition-colors"
              >
                {lp.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================================
   Luxury SVG Icons
   ========================================================================= */

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" strokeWidth="2.5" />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function LocationIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SparklesIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function StarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
