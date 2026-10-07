import Link from "next/link";
import type { BusinessSettings, SocialSettings } from "@/types/settings";

interface FooterProps {
  business?: BusinessSettings;
  social?: SocialSettings;
}

export function Footer({ business, social }: FooterProps) {
  const currentYear = 2026;
  const name = business?.business_name || "Nandhini Makeup & Jewellery";

  // Format opening hours summary
  const hasHours = Boolean(business?.opening_hours);
  const weekday = business?.opening_hours?.monday;
  const sunday = business?.opening_hours?.sunday;

  return (
    <footer className="border-border bg-page-background border-t py-12 text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Info */}
          <div className="space-y-3">
            <h3 className="font-heading text-foreground text-xl font-semibold">
              {name}
            </h3>
            {business?.tagline && (
              <p className="text-foreground/70 text-xs sm:text-sm">
                {business.tagline}
              </p>
            )}
            {business?.full_address && (
              <p className="text-foreground/80 text-xs leading-relaxed">
                {business.full_address}
              </p>
            )}
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
              Contact & Hours
            </h4>
            {business?.phone && (
              <p>
                <span className="text-foreground/70 text-xs">Phone: </span>
                <a
                  href={`tel:${business.phone}`}
                  className="text-foreground text-xs font-medium hover:underline sm:text-sm"
                >
                  {business.phone}
                </a>
              </p>
            )}
            {business?.email && (
              <p>
                <span className="text-foreground/70 text-xs">Email: </span>
                <a
                  href={`mailto:${business.email}`}
                  className="text-foreground text-xs font-medium hover:underline sm:text-sm"
                >
                  {business.email}
                </a>
              </p>
            )}
            {hasHours && (
              <div className="text-foreground/80 space-y-0.5 pt-1 text-xs">
                <p>
                  Mon – Sat:{" "}
                  {weekday && !weekday.isClosed
                    ? `${weekday.openTime} - ${weekday.closeTime}`
                    : "Closed"}
                </p>
                <p>
                  Sun:{" "}
                  {sunday?.isClosed
                    ? "Closed"
                    : `${sunday?.openTime} - ${sunday?.closeTime}`}
                </p>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
              Connect With Us
            </h4>
            <div className="flex flex-wrap gap-4 text-xs font-medium">
              {social?.instagram_primary && (
                <a
                  href={social.instagram_primary}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:opacity-80"
                >
                  Instagram
                </a>
              )}
              {social?.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:opacity-80"
                >
                  Facebook
                </a>
              )}
              {social?.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:opacity-80"
                >
                  YouTube
                </a>
              )}
            </div>
            {/* Quick Links for completed public pages (Home only in 3.4) */}
            <div className="pt-2">
              <Link
                href="/"
                className="text-foreground/70 hover:text-foreground text-xs transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="border-border text-foreground/60 mt-8 border-t pt-6 text-center text-xs">
          <p>
            © {currentYear} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
