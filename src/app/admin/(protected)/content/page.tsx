import type { Metadata } from "next";
import { connection } from "next/server";
import {
  getTestimonials,
  getFAQs,
  getAnnouncements,
} from "@/lib/actions/content";
import { PageHeader } from "@/components/admin/page-header";
import { ContentClient } from "./content-client";

export const metadata: Metadata = {
  title: "Content | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function ContentPage() {
  await connection();
  const [testimonialsRes, faqsRes, announcementsRes] = await Promise.all([
    getTestimonials(),
    getFAQs(),
    getAnnouncements(),
  ]);

  const testimonials = testimonialsRes.success ? testimonialsRes.data : [];
  const faqs = faqsRes.success ? faqsRes.data : [];
  const announcements = announcementsRes.success ? announcementsRes.data : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <PageHeader
        title="Content"
        description="Manage customer testimonials, frequently asked questions, and website announcement banner."
      />
      <ContentClient
        initialTestimonials={testimonials}
        initialFAQs={faqs}
        initialAnnouncements={announcements}
      />
    </div>
  );
}
