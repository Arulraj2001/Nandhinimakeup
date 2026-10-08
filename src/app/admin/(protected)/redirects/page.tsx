import type { Metadata } from "next";
import { connection } from "next/server";
import { getAdminRedirects } from "@/lib/actions/redirects-admin";
import { PageHeader } from "@/components/admin/page-header";
import { RedirectsClient } from "./redirects-client";

export const metadata: Metadata = {
  title: "Redirects Management | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function RedirectsPage() {
  await connection();
  const res = await getAdminRedirects();
  const redirects = res.success ? res.data : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PageHeader
        title="URL Redirects"
        description="Manage permanent (301) and temporary (302) HTTP redirects. Prevent 404 broken links and preserve SEO equity."
      />
      <RedirectsClient initialRedirects={redirects} />
    </div>
  );
}
