import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AnnouncementBar } from "@/components/public/announcement-bar";
import { FloatingWhatsApp } from "@/components/public/floating-whatsapp";
import { MotionProvider } from "@/components/public/motion-provider";
import { GoogleAnalytics } from "@/components/public/google-analytics";
import { getPublicSiteSettings, getPublicMedia } from "@/lib/data/settings";
import { getPublicActiveAnnouncement } from "@/lib/data/announcements";
import { getPublishedLegalPages } from "@/lib/data/legal-pages";
import { hasPublishedBlogPosts } from "@/lib/data/blog";
import { getPublicMediaUrl } from "@/lib/utils/media";
import { extractSearchConsoleToken } from "@/lib/seo/metadata-builder";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const searchConsoleToken = extractSearchConsoleToken(
    settings.analytics?.search_console_code
  );

  return {
    verification: searchConsoleToken
      ? {
          google: searchConsoleToken,
        }
      : undefined,
  };
}

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, announcement, legalPages, hasBlog] = await Promise.all([
    getPublicSiteSettings(),
    getPublicActiveAnnouncement(),
    getPublishedLegalPages(),
    hasPublishedBlogPosts(),
  ]);

  const logoMedia = await getPublicMedia(settings.branding.logo_media_id);
  const logoUrl = logoMedia ? getPublicMediaUrl(logoMedia.storage_path) : null;

  return (
    <MotionProvider>
      <div className="bg-page-background text-foreground flex min-h-screen flex-col">
        <GoogleAnalytics gaId={settings.analytics?.google_analytics_id} />
        <div className="sticky top-0 z-40">
          <AnnouncementBar announcement={announcement} />
          <Header
            businessName={settings.business.business_name}
            logoUrl={logoUrl}
            logoAlt={logoMedia?.alt_text}
            whatsappNumber={settings.business.whatsapp_number}
            acceptOrders={settings.shipping.accept_orders}
            hasBlog={hasBlog}
          />
        </div>
        <main className="flex-1">{children}</main>
        <Footer
          business={settings.business}
          social={settings.social}
          legalPages={legalPages}
        />
        <FloatingWhatsApp
          phoneNumber={settings.business.whatsapp_number}
          businessName={settings.business.business_name}
        />
      </div>
    </MotionProvider>
  );
}
