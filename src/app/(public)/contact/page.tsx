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
      title: "Contact Us",
      description: `Get in touch with ${settings.business.business_name} for bridal appointments, makeover bookings, bespoke jewellery consultations, and studio visits.`,
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

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  const { business, social } = settings;

  const hasPhone = Boolean(business.phone?.trim());
  const hasWhatsApp = Boolean(business.whatsapp_number?.trim());
  const hasEmail = Boolean(business.email?.trim());
  const hasAddress = Boolean(business.full_address?.trim());
  const hasMapsLink = Boolean(business.google_maps_link?.trim());

  const whatsappUrl = hasWhatsApp
    ? buildWhatsAppLink({
        phoneNumber: business.whatsapp_number,
        greeting: `Hello ${business.business_name}! I would like to get in touch regarding:`,
      })
    : "";

  const socialLinks = [
    { name: "Instagram", url: social.instagram_primary },
    { name: "Instagram (Jewellery)", url: social.instagram_secondary },
    { name: "Facebook", url: social.facebook },
    { name: "YouTube", url: social.youtube },
  ].filter((s) => Boolean(s.url && s.url.trim().length > 0));

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Contact Us" }]} />

        {/* Page Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="text-foreground/70 mb-2 text-xs font-semibold tracking-widest uppercase">
            Get in Touch
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            Contact & Location
          </h1>
          <p className="text-foreground/80 mt-4 text-base leading-relaxed sm:text-lg">
            We would love to hear from you. Reach out to schedule a bridal
            trial, enquire about bespoke jewellery, or visit our studio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Contact Details & Direct Connect */}
          <div className="space-y-8 lg:col-span-7">
            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {hasPhone && (
                <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-6">
                  <div>
                    <h2 className="font-heading text-foreground text-base font-semibold">
                      Phone Call
                    </h2>
                    <p className="text-foreground/70 mt-1 text-xs">
                      Direct telephone assistance
                    </p>
                  </div>
                  <a
                    href={`tel:${business.phone}`}
                    className="font-heading text-foreground mt-4 text-base font-medium hover:underline"
                  >
                    {business.phone}
                  </a>
                </div>
              )}

              {hasWhatsApp && (
                <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-6">
                  <div>
                    <h2 className="font-heading text-foreground text-base font-semibold">
                      WhatsApp Chat
                    </h2>
                    <p className="text-foreground/70 mt-1 text-xs">
                      Instant replies & bookings
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-foreground text-background hover:bg-foreground/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors"
                    >
                      Chat on WhatsApp
                    </Link>
                  </div>
                </div>
              )}

              {hasEmail && (
                <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-6 sm:col-span-2">
                  <div>
                    <h2 className="font-heading text-foreground text-base font-semibold">
                      Email Address
                    </h2>
                    <p className="text-foreground/70 mt-1 text-xs">
                      For corporate & wedding enquiries
                    </p>
                  </div>
                  <a
                    href={`mailto:${business.email}`}
                    className="font-heading text-foreground mt-4 text-base font-medium break-all hover:underline"
                  >
                    {business.email}
                  </a>
                </div>
              )}
            </div>

            {/* Studio Address */}
            {hasAddress && (
              <div className="border-border bg-surface space-y-4 rounded-xl border p-6">
                <h2 className="font-heading text-foreground text-lg font-semibold">
                  Studio Address
                </h2>
                <p className="text-foreground/85 text-base leading-relaxed whitespace-pre-line">
                  {business.full_address}
                </p>

                {hasMapsLink && (
                  <div className="pt-2">
                    <a
                      href={business.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-foreground/30 text-foreground hover:bg-surface inline-flex items-center justify-center rounded-md border px-4 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="border-border bg-surface space-y-4 rounded-xl border p-6">
                <h2 className="font-heading text-foreground text-lg font-semibold">
                  Connect on Social Media
                </h2>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((s) => (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-border bg-page-background text-foreground hover:bg-accent rounded-lg border px-4 py-2 text-xs font-medium transition-colors"
                    >
                      {s.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opening Hours Schedule */}
          <div className="lg:col-span-5">
            <div className="border-border bg-surface space-y-6 rounded-xl border p-6 sm:p-8">
              <h2 className="font-heading text-foreground border-border border-b pb-4 text-xl font-semibold">
                Opening Hours
              </h2>

              <ul className="divide-border divide-y text-sm">
                {WEEKDAYS.map((day) => {
                  const schedule = business.opening_hours?.[day.key];
                  const isClosed = schedule?.isClosed ?? false;
                  const timeText = isClosed
                    ? "Closed"
                    : schedule?.openTime && schedule?.closeTime
                      ? `${schedule.openTime} – ${schedule.closeTime}`
                      : "By Appointment";

                  return (
                    <li
                      key={day.key}
                      className="flex items-center justify-between py-3"
                    >
                      <span className="text-foreground font-medium">
                        {day.label}
                      </span>
                      <span
                        className={
                          isClosed
                            ? "text-foreground/50 italic"
                            : "text-foreground/90 font-mono text-xs"
                        }
                      >
                        {timeText}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="text-foreground/60 pt-2 text-xs leading-relaxed">
                * Early morning bridal makeup and on-location destination
                styling available upon advance appointment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
