import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Poppins } from "next/font/google";
import { siteConfig } from "@/lib/config/site";
import { env } from "@/lib/config/env";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["600"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.shortDescription,
  verification: {
    google: "P-gNl-gY_6w29NAS7swiQU4bcXQhLkYY6ztNdthpIKU",
  },
  robots: env.ALLOW_INDEXING
    ? {
        index: true,
        follow: true,
      }
    : {
        index: false,
        follow: false,
      },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={siteConfig.defaultLanguage}
      className={`${cormorant.variable} ${poppins.variable}`}
    >
      <body className="bg-page-background text-foreground min-h-screen font-sans antialiased">
        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-5TDQ8B7R8J"
        />
        <Script
          id="google-analytics-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-5TDQ8B7R8J');
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
