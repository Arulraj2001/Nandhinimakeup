import type { Metadata } from "next";
import { getAdminLegalPages } from "@/lib/actions/legal-pages";
import { PageHeader } from "@/components/admin/page-header";
import { LegalClient } from "./legal-client";

export const metadata: Metadata = {
  title: "Legal Pages | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LegalAdminPage() {
  const res = await getAdminLegalPages();
  const pages = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal Pages"
        description="Manage the Privacy Policy, Terms & Conditions, and Shipping & Returns pages."
      />
      <LegalClient initialPages={pages} />
    </div>
  );
}
