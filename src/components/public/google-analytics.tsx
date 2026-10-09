import Script from "next/script";

interface GoogleAnalyticsProps {
  gaId?: string | null;
}

/**
 * Universal Next.js GA4 Tracking Component.
 * Injects Google Analytics 4 tracking script when a valid GA4 Measurement ID is provided in settings.
 */
export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  if (!gaId || !gaId.trim()) {
    return null;
  }

  const cleanId = gaId.trim().toUpperCase();
  if (!/^G-[A-Z0-9]+$/i.test(cleanId)) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${cleanId}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${cleanId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
