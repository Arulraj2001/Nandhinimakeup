import Link from "next/link";

interface AuthorBioProps {
  authorName?: string;
  whatsappNumber?: string | null;
  studioAddress?: string | null;
}

export function AuthorBio({
  authorName = "Nandhini",
  whatsappNumber,
  studioAddress = "Panjakalipatti, Kalipatti, Salem 636455",
}: AuthorBioProps) {
  const cleanPhone = whatsappNumber ? whatsappNumber.replace(/\D/g, "") : "";
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        "Hi Nandhini, I read your bridal guide on the website and would like to check availability for my wedding date."
      )}`
    : null;

  return (
    <section
      aria-label="Author Profile"
      className="relative overflow-hidden rounded-2xl border border-[#E9D4AE]/70 bg-gradient-to-br from-[#FAF7F2] via-[#FDFBF7] to-[#F5ECE0]/60 p-6 sm:p-8 shadow-xs dark:border-border/60 dark:from-card dark:to-muted/30"
    >
      {/* Decorative antique gold corner flourish */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-[#C9A052]/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
        {/* Monogram / Avatar Seal */}
        <div className="relative shrink-0">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-2 border-[#C9A052] bg-gradient-to-br from-[#8C2524] to-[#671A1A] text-white shadow-md">
            <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-[#FDFBF7]">
              N
            </span>
          </div>
          <div
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#E9D4AE] bg-[#C9A052] text-white shadow-xs"
            title="Certified Bridal Artist"
          >
            <svg
              className="h-3.5 w-3.5 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
            </svg>
          </div>
        </div>

        {/* Bio Details */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#8C2524] dark:text-[#C9A052]">
                Written by
              </p>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                {authorName}
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A052]/40 bg-[#C9A052]/10 px-3 py-1 text-[11px] font-medium text-[#8C2524] dark:text-[#E9D4AE]">
              <svg
                className="h-3 w-3 fill-current text-[#C9A052]"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              400+ Brides Styled
            </span>
          </div>

          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
            Lead Bridal Makeup Artist &amp; Jewellery Stylist with 7+ years of
            expertise in South Indian Muhurtham HD artistry, Kanjeevaram saree
            draping, and antique temple jewellery curation across Salem, Erode,
            Namakkal, and Dharmapuri.
          </p>

          {studioAddress && (
            <p className="flex items-center gap-1.5 text-xs text-foreground/60">
              <svg
                className="h-3.5 w-3.5 text-[#C9A052] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Studio: {studioAddress}</span>
            </p>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
              >
                <svg
                  className="h-3.5 w-3.5 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12.031 2C6.49 2 2 6.49 2 12.031c0 1.77.462 3.498 1.341 5.023L2 22l5.093-1.334a10.016 10.016 0 004.938 1.285h.004c5.54 0 10.03-4.49 10.03-10.03C22.065 6.49 17.572 2 12.031 2zm5.836 14.195c-.244.686-1.42 1.328-1.954 1.412-.49.076-1.127.108-3.623-.924-2.92-1.206-4.802-4.186-4.948-4.38-.146-.194-1.185-1.576-1.185-3.006 0-1.43.748-2.133 1.014-2.424.266-.29.58-.363.774-.363.194 0 .388.002.557.01.18.01.42.068.657.636.244.58.832 2.03.905 2.176.073.146.121.316.024.51-.097.194-.145.316-.29.485-.146.17-.307.38-.438.51-.146.146-.298.307-.128.599.17.29 1.135 1.87 2.436 3.03 1.674 1.493 3.085 1.956 3.523 2.175.438.22.695.183.955-.11.26-.292 1.114-1.298 1.41-1.745.298-.448.597-.374.998-.22.4.154 2.535 1.196 2.97 1.413.438.219.728.328.835.51.107.182.107 1.054-.137 1.74z" />
                </svg>
                Consult on WhatsApp
              </a>
            )}
            <Link
              href="/services"
              className="inline-flex items-center rounded-lg border border-[#C9A052]/50 bg-white/80 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-white dark:bg-card/80 dark:hover:bg-card"
            >
              Bridal Services
            </Link>
            <Link
              href="/jewellery"
              className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:text-foreground"
            >
              Rental Jewellery
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
