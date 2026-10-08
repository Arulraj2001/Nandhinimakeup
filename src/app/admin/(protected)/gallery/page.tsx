import type { Metadata } from "next";
import { connection } from "next/server";
import { getGalleryItems } from "@/lib/actions/gallery";
import { getServiceCategories } from "@/lib/actions/services";
import { PageHeader } from "@/components/admin/page-header";
import { GalleryClient } from "./gallery-client";

export const metadata: Metadata = {
  title: "Gallery | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function GalleryPage() {
  await connection();
  const [galleryRes, categoriesRes] = await Promise.all([
    getGalleryItems(),
    getServiceCategories(),
  ]);

  const items = galleryRes.success ? galleryRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PageHeader
        title="Gallery"
        description="Showcase portfolio photos and before & after transformations."
      />
      <GalleryClient initialItems={items} categories={categories} />
    </div>
  );
}
