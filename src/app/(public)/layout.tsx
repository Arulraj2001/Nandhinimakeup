import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AnnouncementBar } from "@/components/public/announcement-bar";
import { FloatingWhatsApp } from "@/components/public/floating-whatsapp";
import { getPublicSiteSettings, getPublicMedia } from "@/lib/data/settings";
import { getPublicActiveAnnouncement } from "@/lib/data/announcements";
import { getPublicMediaUrl } from "@/lib/utils/media";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, announcement] = await Promise.all([
    getPublicSiteSettings(),
    getPublicActiveAnnouncement(),
  ]);

  const logoMedia = await getPublicMedia(settings.branding.logo_media_id);
  const logoUrl = logoMedia ? getPublicMediaUrl(logoMedia.storage_path) : null;

  return (
    <div className="bg-page-background text-foreground flex min-h-screen flex-col">
      <AnnouncementBar announcement={announcement} />
      <Header
        businessName={settings.business.business_name}
        logoUrl={logoUrl}
        logoAlt={logoMedia?.alt_text}
        whatsappNumber={settings.business.whatsapp_number}
        acceptOrders={settings.shipping.accept_orders}
      />
      <main className="flex-1">{children}</main>
      <Footer business={settings.business} social={settings.social} />
      <FloatingWhatsApp
        phoneNumber={settings.business.whatsapp_number}
        businessName={settings.business.business_name}
      />
    </div>
  );
}
