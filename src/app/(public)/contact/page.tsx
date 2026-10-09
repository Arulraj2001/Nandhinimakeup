import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSiteSettings } from "@/lib/data/settings";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { Breadcrumb } from "@/components/public/breadcrumb";
import { buildMetadata } from "@/lib/seo/metadata-builder";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();

  return buildMetadata({
    path: "/contact",
    generated: {
      title: "Contact & Studio Location",
      description: `Visit ${settings.business.business_name} in Salem, Tamil Nadu, or reach out for bridal makeup bookings, wedding trials, and curated jewellery rental consultations.`,
    },
  });
}

const WEEKDAYS: Array<{
  key: keyof typeof import("@/types/settings").DEFAULT_BUSINESS_SETTINGS.opening_hours;
  label: string;
}> = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

/**
 * Verified Google Maps Embed URL pointing to Nandhini Makeup Artist in Salem, Tamil Nadu.
 * Coordinates: 11.7641475, 78.011412.
 */
const GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3907.123!2d78.011412!3d11.7641475!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3babffcbcb90f401%3A0x40b2539124193e25!2sNandhini__Makeup_Artist!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin";

function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr || "00"} ${ampm}`;
}

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  const { business, social } = settings;

  const hasPhone = Boolean(business.phone?.trim());
  const hasWhatsApp = Boolean(business.whatsapp_number?.trim());
  const hasEmail = Boolean(business.email?.trim());
  const hasAddress = Boolean(business.full_address?.trim());
  const mapsLink =
    business.google_maps_link?.trim() ||
    "https://maps.app.goo.gl/qH9srr73zGcWjFNe9";

  const whatsappUrl = hasWhatsApp
    ? buildWhatsAppLink({
        phoneNumber: business.whatsapp_number,
        greeting: `Hello ${business.business_name}! I would like to enquire about bridal makeup and jewellery booking:`,
      })
    : "";

  const socialLinks = [
    {
      name: "Instagram (Makeup)",
      handle: "@nandhini__makeup_artist",
      url: social.instagram_primary,
      type: "instagram",
    },
    {
      name: "Instagram (Jewellery)",
      handle: "@nandhu_accessorie",
      url: social.instagram_secondary,
      type: "instagram",
    },
    {
      name: "Facebook",
      handle: "Nandhini Makeup Artist",
      url: social.facebook,
      type: "facebook",
    },
    {
      name: "YouTube",
      handle: "Nandhini Makeup",
      url: social.youtube,
      type: "youtube",
    },
  ].filter((s) => Boolean(s.url && s.url.trim().length > 0));

  return (
    <div className="pt-2 pb-12 sm:pt-4 sm:pb-16 md:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Contact Us" }]} />

        {/* Page Hero Header - Compact */}
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          <div className="border-gold/30 bg-surface-subtle/80 text-accent mb-2.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-semibold tracking-wider uppercase shadow-2xs backdrop-blur-xs">
            <SparklesIcon className="h-3 w-3 text-gold" />
            <span>Salem Bridal Studio &amp; Consultations</span>
          </div>

          <h1 className="font-heading text-foreground text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Get in Touch &amp; Visit Our Studio
          </h1>

          <p className="text-foreground/80 mx-auto mt-2 max-w-2xl text-xs leading-relaxed sm:text-sm">
            Reach out to schedule a bridal trial, enquire about curated temple jewellery
            rentals, or visit our studio in Salem, Tamil Nadu.
          </p>
        </div>

        {/* 3 Quick Direct Connect Channels - Medium / Compact Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Phone Call Card */}
          {hasPhone && (
            <div className="border-border/80 bg-surface group relative flex flex-col justify-between rounded-xl border p-4 sm:p-5 shadow-2xs transition-all duration-300 hover:border-gold hover:shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <div className="border-gold/30 bg-surface-subtle flex h-9 w-9 items-center justify-center rounded-lg border text-accent">
                    <PhoneIcon className="h-4 w-4" />
                  </div>
                  <span className="border-border/60 bg-page-background text-foreground/70 rounded-full border px-2 py-0.5 text-[10px] font-medium">
                    Call Directly
                  </span>
                </div>
                <h2 className="font-heading text-foreground mt-3 text-base font-semibold">
                  Telephone Call
                </h2>
                <p className="text-foreground/70 mt-0.5 text-xs leading-relaxed">
                  Immediate consultation &amp; slot checks.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60">
                <a
                  href={`tel:${business.phone}`}
                  className="font-heading text-foreground group-hover:text-accent flex items-center justify-between text-sm font-semibold transition-colors"
                >
                  <span>{business.phone}</span>
                  <span className="text-gold group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </a>
              </div>
            </div>
          )}

          {/* WhatsApp Chat Card (Featured Hero Accent) */}
          {hasWhatsApp && (
            <div className="border-[#15803D]/30 bg-surface group relative flex flex-col justify-between rounded-xl border p-4 sm:p-5 shadow-2xs transition-all duration-300 hover:border-[#15803D] hover:shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <div className="border-[#15803D]/20 bg-[#15803D]/10 flex h-9 w-9 items-center justify-center rounded-lg border text-[#15803D]">
                    <WhatsAppIcon className="h-4 w-4" />
                  </div>
                  <span className="border-[#15803D]/20 bg-[#15803D]/10 text-[#15803D] rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                    Fastest Reply ⚡
                  </span>
                </div>
                <h2 className="font-heading text-foreground mt-3 text-base font-semibold">
                  WhatsApp Chat
                </h2>
                <p className="text-foreground/70 mt-0.5 text-xs leading-relaxed">
                  Send outfit photos &amp; get pricing instantly.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60">
                <Link
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#15803D] hover:bg-[#166534] text-white shadow-2xs inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold tracking-wider uppercase transition-all hover:shadow-xs"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  <span>Chat on WhatsApp</span>
                </Link>
              </div>
            </div>
          )}

          {/* Email Address Card */}
          {hasEmail && (
            <div className="border-border/80 bg-surface group relative flex flex-col justify-between rounded-xl border p-4 sm:p-5 shadow-2xs transition-all duration-300 hover:border-gold hover:shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <div className="border-gold/30 bg-surface-subtle flex h-9 w-9 items-center justify-center rounded-lg border text-accent">
                    <MailIcon className="h-4 w-4" />
                  </div>
                  <span className="border-border/60 bg-page-background text-foreground/70 rounded-full border px-2 py-0.5 text-[10px] font-medium">
                    Official Inquiries
                  </span>
                </div>
                <h2 className="font-heading text-foreground mt-3 text-base font-semibold">
                  Email Studio
                </h2>
                <p className="text-foreground/70 mt-0.5 text-xs leading-relaxed">
                  Destination weddings &amp; bridal packages.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60">
                <a
                  href={`mailto:${business.email}`}
                  className="font-heading text-foreground group-hover:text-accent flex items-center justify-between text-xs font-semibold break-all transition-colors"
                >
                  <span className="truncate">{business.email}</span>
                  <span className="text-gold group-hover:translate-x-1 transition-transform ml-1">
                    →
                  </span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Main Studio Information & Interactive Google Map Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-stretch">
          {/* Left Column: Studio Address, Opening Hours & Socials (5 Cols) */}
          <div className="space-y-5 lg:col-span-5 flex flex-col justify-between">
            {/* Studio Address Card - Medium / Compact */}
            {hasAddress && (
              <div className="border-border/80 bg-surface rounded-xl border p-4.5 sm:p-5 shadow-2xs relative">
                <div className="flex items-center gap-3">
                  <div className="border-gold/30 bg-surface-subtle flex h-9 w-9 flex-none items-center justify-center rounded-lg border text-accent">
                    <LocationIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-foreground/60 text-[10px] font-semibold tracking-wider uppercase">
                      Physical Atelier
                    </span>
                    <h2 className="font-heading text-foreground text-lg font-semibold leading-tight">
                      Salem Studio Location
                    </h2>
                  </div>
                </div>

                <div className="mt-3 text-xs leading-relaxed">
                  <p className="text-foreground/90 font-medium">
                    {business.business_name}
                  </p>
                  <p className="text-foreground/80 mt-1 whitespace-pre-line">
                    {business.full_address || "Panjakalipatti, Kalipatti, Salem, Tamil Nadu 636455"}
                  </p>

                  <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-[11px] text-foreground/70">
                    <p className="flex items-center gap-1.5">
                      <span className="text-gold">✦</span>
                      <span>Convenient road connectivity across Salem with dedicated parking.</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-gold">✦</span>
                      <span>Private bridal dressing rooms &amp; jewellery trial lounge.</span>
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-accent hover:bg-accent-hover text-white shadow-2xs inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold tracking-wider uppercase transition-all hover:shadow-xs"
                    >
                      <NavigationIcon className="h-3 w-3" />
                      <span>Get Directions</span>
                    </a>

                    {hasPhone && (
                      <a
                        href={`tel:${business.phone}`}
                        className="border-border bg-page-background text-foreground hover:bg-surface-subtle hover:border-gold inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium transition-colors"
                      >
                        <PhoneIcon className="h-3 w-3 text-accent" />
                        <span>Call Studio</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Opening Hours Schedule Card - Medium / Compact */}
            <div className="border-border/80 bg-surface rounded-xl border p-4.5 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="border-gold/30 bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-lg border text-accent">
                    <ClockIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-heading text-foreground text-base font-semibold leading-tight">
                      Opening Hours
                    </h2>
                    <p className="text-foreground/60 text-[11px]">
                      Consultation timings
                    </p>
                  </div>
                </div>

                <span className="border-border/70 bg-page-background text-foreground/80 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mon – Sat Open
                </span>
              </div>

              <ul className="divide-border/60 divide-y text-xs mt-2">
                {WEEKDAYS.map((day) => {
                  const schedule = business.opening_hours?.[day.key];
                  const isClosed = schedule?.isClosed ?? false;
                  const timeFormatted =
                    schedule?.openTime && schedule?.closeTime
                      ? `${formatTime12h(schedule.openTime)} – ${formatTime12h(schedule.closeTime)}`
                      : "By Appointment";

                  return (
                    <li
                      key={day.key}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-foreground font-medium">
                        {day.label}
                      </span>
                      <span
                        className={
                          isClosed
                            ? "text-accent/80 font-medium italic text-[11px]"
                            : "text-foreground/90 font-mono text-[11px] font-semibold"
                        }
                      >
                        {isClosed ? "Closed (By Appointment)" : timeFormatted}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="border-border/60 mt-3 border-t pt-2.5 text-[10.5px] leading-relaxed text-foreground/70">
                <p>
                  <strong className="text-foreground font-medium">Brides Note:</strong> Early
                  morning muhurtham slots (from 3:00 AM) and outstation wedding travel
                  available upon advance appointment.
                </p>
              </div>
            </div>

            {/* Social Media Links Card - Medium / Compact */}
            {socialLinks.length > 0 && (
              <div className="border-border/80 bg-surface rounded-xl border p-4.5 sm:p-5 shadow-2xs">
                <h2 className="font-heading text-foreground text-sm font-semibold">
                  Follow &amp; Watch Recent Looks
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {socialLinks.map((s) => (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-border bg-page-background text-foreground hover:bg-surface-subtle hover:border-gold hover:text-accent group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all shadow-2xs hover:shadow-xs"
                    >
                      {s.type === "instagram" && <InstagramIcon className="h-3 w-3 text-accent" />}
                      {s.type === "facebook" && <FacebookIcon className="h-3 w-3 text-blue-600" />}
                      {s.type === "youtube" && <YouTubeIcon className="h-3 w-3 text-red-600" />}
                      <span>{s.handle || s.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Google Maps Embedded Showcase (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="border-border/80 bg-surface shadow-2xs flex h-full min-h-[440px] lg:min-h-[500px] flex-col overflow-hidden rounded-xl border">
              {/* Map Top Header Bar - Compact */}
              <div className="border-border/70 bg-surface px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="border-gold/30 bg-surface-subtle flex h-7.5 w-7.5 items-center justify-center rounded-lg border text-accent">
                    <LocationIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-foreground text-sm font-semibold leading-tight">
                      Nandhini Makeup Artist Studio
                    </h3>
                    <p className="text-foreground/60 text-[11px]">
                      {business.address_locality || "Salem"}, Tamil Nadu {business.postal_code || "636455"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="border-gold/30 bg-surface-subtle text-accent rounded-full border px-2 py-0.5 text-[10.5px] font-semibold">
                    ★ 4.9 on Maps
                  </span>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border bg-page-background text-foreground hover:bg-surface-subtle hover:border-gold inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors"
                  >
                    <span>Open Map</span>
                    <span className="text-gold">↗</span>
                  </a>
                </div>
              </div>

              {/* Embedded Interactive Map Frame */}
              <div className="relative w-full flex-1 min-h-[360px] bg-surface-subtle/40">
                <iframe
                  src={GOOGLE_MAPS_EMBED_URL}
                  width="100%"
                  height="100%"
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Nandhini Makeup Artist Salem Studio Location Map"
                />
              </div>

              {/* Map Bottom Helper Bar - Compact */}
              <div className="border-border/70 bg-page-background/70 px-4 py-2.5 border-t text-[11px] text-foreground/75 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <NavigationIcon className="h-3.5 w-3.5 text-accent flex-none" />
                  <span>
                    Salem, Tamil Nadu. Convenient road access across Salem, Erode &amp; Namakkal.
                  </span>
                </div>
                <a
                  href={`tel:${business.phone}`}
                  className="text-accent hover:underline font-medium text-[11px] whitespace-nowrap self-start sm:self-auto"
                >
                  Call for directions →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bridal Muhurtham Booking Advisory Card - Medium / Compact */}
        <div className="border-gold/30 bg-gradient-to-r from-surface via-surface-subtle/80 to-surface mt-8 sm:mt-10 rounded-xl border p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="max-w-xl space-y-1">
              <span className="text-gold text-[10px] font-semibold tracking-wider uppercase">
                ✦ Auspicious Muhurtham Dates ✦
              </span>
              <h2 className="font-heading text-foreground text-lg sm:text-xl font-semibold">
                Planning Your Wedding or Reception Makeover?
              </h2>
              <p className="text-foreground/80 text-xs leading-relaxed">
                Muhurtham dates during peak seasons fill 2 to 6 months in advance. Contact us early
                to lock in your date, schedule a private bridal trial, and select jewellery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 flex-none">
              {whatsappUrl && (
                <Link
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#15803D] hover:bg-[#166534] text-white shadow-2xs inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all hover:shadow-xs"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  <span>Reserve Muhurtham Slot</span>
                </Link>
              )}

              <Link
                href="/services"
                className="border-border bg-surface text-foreground hover:bg-surface-subtle hover:border-gold inline-flex items-center justify-center rounded-lg border px-3.5 py-2 text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                Bridal Packages →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   Luxury SVG Icons
   ========================================================================= */

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

function NavigationIcon({ className = "h-4 w-4" }: { className?: string }) {
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
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

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

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YouTubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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
