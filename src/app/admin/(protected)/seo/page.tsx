import type { Metadata } from "next";
import { connection } from "next/server";
import { getSiteSettings } from "@/lib/actions/settings";
import { getMediaMapByIds } from "@/lib/actions/media";
import { getAdminStaticSeoPages } from "@/lib/actions/seo-admin";
import { PageHeader } from "@/components/admin/page-header";
import { SeoAdminClient } from "./seo-client";

export const metadata: Metadata = {
  title: "SEO Management | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function SeoAdminPage() {
  await connection();
  const [settings, staticPagesRes] = await Promise.all([
    getSiteSettings(),
    getAdminStaticSeoPages(),
  ]);

  const staticPages = staticPagesRes.success ? staticPagesRes.data : [];

  const mediaIds = [
    settings.seo.default_social_image_id,
    ...staticPages
      .map((p) => p.og_image_id)
      .filter((id): id is string => Boolean(id)),
  ].filter((id): id is string => Boolean(id));

  const mediaRes = await getMediaMapByIds(mediaIds);
  const mediaMap = mediaRes.success ? mediaRes.data : {};

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PageHeader
        title="SEO Management"
        description="Configure search engine optimization for all static pages and global discovery settings."
      />
      <SeoAdminClient
        initialStaticPages={staticPages}
        initialSettings={settings}
        initialMediaMap={mediaMap}
      />
    </div>
  );
}
