import Link from "next/link";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import type { BusinessSettings, SocialSettings } from "@/types/settings";

interface FooterProps {
  business?: BusinessSettings;
  social?: SocialSettings;
  legalPages?: Array<{ slug: string; title: string }>;
}

export function Footer({ business, social, legalPages = [] }: FooterProps) {
  const currentYear = 2026;
  const name = business?.business_name || "Nandhini Makeup & Jewellery";

  // Format opening hours summary
  const hasHours = Boolean(business?.opening_hours);
  const weekday = business?.opening_hours?.monday;
  const sunday = business?.opening_hours?.sunday;

  const instagramPrimary =
    social?.instagram_primary ||
    "https://www.instagram.com/nandhini__makeupartist/";
  const instagramSecondary =
    social?.instagram_secondary ||
    "https://www.instagram.com/nandhu_accessorie/";
  const fullAddress =
    business?.full_address || "Fairlands, Salem, Tamil Nadu - 636016, India";

  const whatsAppLink =
    (business?.whatsapp_number || "+917010847631")
      ? buildWhatsAppLink({
          phoneNumber: business?.whatsapp_number || "+917010847631",
          greeting: `Hello ${name}! I would like to make an enquiry regarding makeup and jewellery:`,
        })
      : "";

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
            <p className="text-foreground/80 text-xs leading-relaxed">
              {fullAddress}
            </p>
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

          {/* Social & Direct Contact Links */}
          <div className="space-y-3">
            <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
              Connect With Us
            </h4>
            <div className="flex flex-col gap-2 text-xs font-medium">
              <a
                href={instagramPrimary}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline inline-flex items-center gap-1.5"
              >
                <span className="font-semibold text-foreground/80">Instagram (Makeup):</span>
                <span>@nandhini__makeupartist</span>
              </a>
              <a
                href={instagramSecondary}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline inline-flex items-center gap-1.5"
              >
                <span className="font-semibold text-foreground/80">Instagram (Jewellery):</span>
                <span>@nandhu_accessorie</span>
              </a>
              {whatsAppLink && (
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline inline-flex items-center gap-1.5"
                >
                  <span className="font-semibold text-foreground/80">WhatsApp:</span>
                  <span>{business?.whatsapp_number || "+91 7010847631"}</span>
                </a>
              )}
              <Link
                href="/contact"
                className="text-foreground hover:underline inline-flex items-center gap-1.5"
              >
                <span className="font-semibold text-foreground/80">Studio & Contact:</span>
                <span>Salem, Tamil Nadu</span>
              </Link>
            </div>
            {/* Quick Links for completed public pages */}
            <div className="space-y-1.5 pt-2">
              <h5 className="text-foreground/80 text-[11px] font-semibold tracking-wider uppercase">
                Explore & Support
              </h5>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                <Link
                  href="/services"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  Services
                </Link>
                <Link
                  href="/jewellery"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  Jewellery
                </Link>
                <Link
                  href="/gallery"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  Gallery
                </Link>
                <Link
                  href="/about"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-foreground/70 hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
                <Link
                  href="/reviews"
                  className="text-foreground/70 hover:text-foreground font-medium transition-colors"
                >
                  Reviews
                </Link>
                <Link
                  href="/faq"
                  className="text-foreground/70 hover:text-foreground font-medium transition-colors"
                >
                  FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>

        {legalPages.length > 0 && (
          <div className="border-border mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t pt-4 text-xs">
            {legalPages.map((lp) => (
              <Link
                key={lp.slug}
                href={
                  lp.slug === "shipping-and-returns"
                    ? "/shipping-returns"
                    : `/${lp.slug}`
                }
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                {lp.title}
              </Link>
            ))}
          </div>
        )}

        {/* Bottom copyright line */}
        <div className="border-border text-foreground/60 mt-4 border-t pt-4 text-center text-xs">
          <p>
            © {currentYear} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
