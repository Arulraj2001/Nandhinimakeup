import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/actions/settings";
import { getMediaMapByIds } from "@/lib/actions/media";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Site Settings | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  const mediaIds = [
    settings.branding.logo_media_id,
    settings.branding.favicon_media_id,
    settings.payments.upi_qr_media_id,
    settings.home.hero_image_id,
    settings.about.portrait_image_id,
  ].filter((id): id is string => Boolean(id));

  const mediaRes = await getMediaMapByIds(mediaIds);
  const mediaMap = mediaRes.success ? mediaRes.data : {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Settings"
        description="Manage business details, social links, UPI payment info, shipping charges, branding, and analytics."
      />
      <SettingsClient initialSettings={settings} initialMediaMap={mediaMap} />
    </div>
  );
}
