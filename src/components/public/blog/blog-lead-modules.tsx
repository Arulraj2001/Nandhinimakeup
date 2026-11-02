import Link from "next/link";

interface BlogQuoteCalloutProps {
  postTitle?: string;
  whatsappNumber?: string | null;
}

export function BlogQuoteCallout({
  postTitle,
  whatsappNumber,
}: BlogQuoteCalloutProps) {
  const cleanPhone = whatsappNumber ? whatsappNumber.replace(/\D/g, "") : "";
  const queryText = postTitle
    ? `Hi Nandhini, I was reading your guide on "${postTitle}". Can you share package details and availability for my wedding date?`
    : "Hi Nandhini, I would like to check availability and package pricing for my wedding date.";

  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(queryText)}`
    : null;

  return (
    <div className="my-10 overflow-hidden rounded-2xl border-2 border-[#C9A052]/40 bg-gradient-to-br from-[#FAF7F2] via-white to-[#F6EDE1] p-6 sm:p-8 shadow-xs dark:from-card dark:via-card/90 dark:to-muted/40 dark:border-[#C9A052]/30">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A052]/40 bg-[#C9A052]/15 px-3 py-0.5 text-[11px] font-semibold tracking-wider text-[#8C2524] uppercase dark:text-[#E9D4AE]">
            <svg
              className="h-3 w-3 fill-current text-[#C9A052]"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
            </svg>
            Muhurtham Bookings 2026
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
            Planning Your Wedding in Salem or Nearby Districts?
          </h3>
          <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
            Muhurtham dates fill quickly during auspicious wedding seasons. Connect
            directly with Nandhini to check date availability and get a customized
            makeup &amp; antique jewellery rental quote.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
            >
              <svg
                className="h-4 w-4 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12.031 2C6.49 2 2 6.49 2 12.031c0 1.77.462 3.498 1.341 5.023L2 22l5.093-1.334a10.016 10.016 0 004.938 1.285h.004c5.54 0 10.03-4.49 10.03-10.03C22.065 6.49 17.572 2 12.031 2zm5.836 14.195c-.244.686-1.42 1.328-1.954 1.412-.49.076-1.127.108-3.623-.924-2.92-1.206-4.802-4.186-4.948-4.38-.146-.194-1.185-1.576-1.185-3.006 0-1.43.748-2.133 1.014-2.424.266-.29.58-.363.774-.363.194 0 .388.002.557.01.18.01.42.068.657.636.244.58.832 2.03.905 2.176.073.146.121.316.024.51-.097.194-.145.316-.29.485-.146.17-.307.38-.438.51-.146.146-.298.307-.128.599.17.29 1.135 1.87 2.436 3.03 1.674 1.493 3.085 1.956 3.523 2.175.438.22.695.183.955-.11.26-.292 1.114-1.298 1.41-1.745.298-.448.597-.374.998-.22.4.154 2.535 1.196 2.97 1.413.438.219.728.328.835.51.107.182.107 1.054-.137 1.74z" />
              </svg>
              Check Dates on WhatsApp
            </a>
          )}
          <Link
            href="/services"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C9A052]/60 bg-white/90 px-5 py-3 text-xs font-bold tracking-wider text-foreground uppercase transition-colors hover:bg-[#FAF7F2] dark:bg-card dark:hover:bg-muted"
          >
            <svg
              className="h-4 w-4 text-[#C9A052]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            View Service Packages
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Editorial Affiliate Disclosure Box
 */
export function BlogAffiliateNotice() {
  return (
    <div className="my-6 rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-3 text-[11px] text-foreground/70 leading-relaxed">
      <span className="font-semibold text-foreground/90">Editorial Disclosure:</span>{" "}
      We only recommend beauty prep tools and skincare products that we personally test
      and trust for our brides. If you purchase through our links, we may earn a small
      commission at zero extra cost to you.
    </div>
  );
}

/**
 * CLS-Safe Reserved Ad Slot Container
 */
interface BlogAdSlotProps {
  slotId?: string;
  format?: "banner" | "rectangle";
}

export function BlogAdSlot({ format = "rectangle" }: BlogAdSlotProps) {
  return (
    <div
      aria-label="Advertisement"
      className={`my-8 mx-auto flex items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/15 text-[11px] text-muted-foreground/60 ${
        format === "banner"
          ? "min-h-[90px] max-w-3xl w-full"
          : "min-h-[250px] max-w-sm w-full"
      }`}
    >
      <span className="italic select-none">Advertisement</span>
    </div>
  );
}
