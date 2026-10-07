import type { Metadata } from "next";
import { Cormorant_Garamond, Poppins } from "next/font/google";
import { siteConfig } from "@/lib/config/site";
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
        {children}
      </body>
    </html>
  );
}
