import type { Metadata } from "next";
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

export default async function ServicesPage() {
  const [servicesRes, categoriesRes] = await Promise.all([
    getServices(),
    getServiceCategories(),
  ]);

  const services = servicesRes.success ? servicesRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];

  return (
    <div className="space-y-6">
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
