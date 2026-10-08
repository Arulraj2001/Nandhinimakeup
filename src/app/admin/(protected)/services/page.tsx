import type { Metadata } from "next";
import { connection } from "next/server";
import { getServices, getServiceCategories } from "@/lib/actions/services";
import { PageHeader } from "@/components/admin/page-header";
import { ServicesClient } from "./services-client";

export const metadata: Metadata = {
  title: "Services | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function ServicesPage() {
  await connection();
  const [servicesRes, categoriesRes] = await Promise.all([
    getServices(),
    getServiceCategories(),
  ]);

  const services = servicesRes.success ? servicesRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PageHeader
        title="Services & Packages"
        description="Manage beauty parlour and bridal services, category organization, inclusions, and pricing."
      />
      <ServicesClient
        initialServices={services}
        initialCategories={categories}
      />
    </div>
  );
}
