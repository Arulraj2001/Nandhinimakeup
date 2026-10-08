import type { Metadata } from "next";
import { connection } from "next/server";
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

export const instant = false;

export default async function LegalAdminPage() {
  await connection();
  const res = await getAdminLegalPages();
  const pages = res.success ? res.data : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PageHeader
        title="Legal Pages"
        description="Manage the Privacy Policy, Terms & Conditions, and Shipping & Returns pages."
      />
      <LegalClient initialPages={pages} />
    </div>
  );
}
