import { z } from "zod";
import type { Database } from "@/types/database";
import type { MediaItem } from "@/lib/actions/media";

export type SeoPageRow = Database["public"]["Tables"]["seo_pages"]["Row"];

export const seoFormFieldsSchema = z.object({
  seo_title: z
    .string()
    .trim()
    .max(70, "SEO title must not exceed 70 characters")
    .optional()
    .nullable()
    .transform((val) => val || null),
  seo_description: z
    .string()
    .trim()
    .max(200, "SEO description must not exceed 200 characters")
    .optional()
    .nullable()
    .transform((val) => val || null),
  seo_social_image_id: z
    .string()
    .uuid("Invalid media ID")
    .optional()
    .nullable()
    .transform((val) => val || null),
  noindex: z.boolean().default(false),
  focus_keyword: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export type SeoFormFields = z.infer<typeof seoFormFieldsSchema>;

export const saveStaticPageSeoSchema = z.object({
  path: z.string().min(1, "Page path is required"),
  seo_title: z
    .string()
    .trim()
    .max(70, "SEO title must not exceed 70 characters")
    .optional()
    .nullable()
    .transform((val) => val || null),
  seo_description: z
    .string()
    .trim()
    .max(200, "SEO description must not exceed 200 characters")
    .optional()
    .nullable()
    .transform((val) => val || null),
  seo_social_image_id: z
    .string()
    .uuid("Invalid media ID")
    .optional()
    .nullable()
    .transform((val) => val || null),
  canonical_url: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        // Same-site URLs only: either relative starting with '/' or matching site domain
        if (val.startsWith("/")) return true;
        try {
          const u = new URL(val);
          const site =
            process.env.NEXT_PUBLIC_SITE_URL || "https://nandhinimakeup.com";
          const siteHost = new URL(site).host;
          return u.host === siteHost;
        } catch {
          return false;
        }
      },
      { message: "Canonical URL must be a same-site relative path or site URL" }
    )
    .transform((val) => val || null),
  noindex: z.boolean().default(false),
  focus_keyword: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export type SaveStaticPageSeoInput = z.infer<typeof saveStaticPageSeoSchema>;

export interface StaticPageMeta {
  path: string;
  name: string;
  description: string;
}

export const STATIC_PAGES_LIST: StaticPageMeta[] = [
  { path: "/", name: "Home", description: "Main landing page" },
  {
    path: "/services",
    name: "Services Index",
    description: "All bridal & salon services catalog",
  },
  {
    path: "/jewellery",
    name: "Jewellery Index",
    description: "Bespoke jewellery collection",
  },
  {
    path: "/gallery",
    name: "Gallery",
    description: "Bridal makeover & hairstyle portfolio",
  },
  {
    path: "/reviews",
    name: "Reviews",
    description: "Client testimonials and bride feedback",
  },
  {
    path: "/faq",
    name: "FAQ",
    description: "Frequently asked booking & service questions",
  },
  {
    path: "/about",
    name: "About Us",
    description: "Brand story, artist credentials & highlights",
  },
  {
    path: "/contact",
    name: "Contact",
    description: "Studio address, phone, WhatsApp & hours",
  },
  {
    path: "/blog",
    name: "Blog Index",
    description: "Bridal beauty articles and beauty journal",
  },
  {
    path: "/privacy-policy",
    name: "Privacy Policy",
    description: "Customer privacy terms",
  },
  {
    path: "/terms-and-conditions",
    name: "Terms & Conditions",
    description: "Terms for orders and bookings",
  },
  {
    path: "/shipping-returns",
    name: "Shipping & Returns",
    description: "Delivery timelines and returns policy",
  },
];

export interface StaticPageSeoRowWithMedia extends SeoPageRow {
  social_image?: MediaItem | null;
}
