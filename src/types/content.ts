import { z } from "zod";
import type { Database } from "@/types/database";

// Database row types
export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
export type FAQ = Database["public"]["Tables"]["faqs"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

export type TestimonialSource = "google" | "instagram" | "whatsapp" | "direct";
export type FAQGroup =
  | "general"
  | "services"
  | "jewellery"
  | "orders_and_shipping"
  | "orders and shipping";

// Testimonial schema
export const saveTestimonialSchema = z.object({
  id: z.string().uuid().optional(),
  customer_name: z.string().trim().min(1, "Customer name is required"),
  occasion: z.string().trim().nullable().optional(),
  quote: z.string().trim().min(1, "Quote is required"),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  source: z.enum(["google", "instagram", "whatsapp", "direct"]),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  sort_order: z.number().int(),
});

export type SaveTestimonialInput = z.infer<typeof saveTestimonialSchema>;

// FAQ schema
export const saveFAQSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().trim().min(1, "Question is required"),
  answer: z.string().trim().min(1, "Answer is required"),
  group: z.enum([
    "general",
    "services",
    "jewellery",
    "orders_and_shipping",
    "orders and shipping",
  ]),
  is_published: z.boolean(),
  sort_order: z.number().int(),
});

export type SaveFAQInput = z.infer<typeof saveFAQSchema>;

// Link validation helper for announcements: relative paths (/...) or https://
const safeLinkRegex = /^(https:\/\/|\/)/i;

export const saveAnnouncementSchema = z
  .object({
    id: z.string().uuid().optional(),
    message: z.string().trim().min(1, "Message is required"),
    link_url: z
      .string()
      .trim()
      .nullable()
      .optional()
      .refine(
        (val) => !val || safeLinkRegex.test(val),
        "Link must be a relative URL (starting with /) or secure external URL (https://)"
      ),
    link_label: z.string().trim().nullable().optional(),
    is_active: z.boolean(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["end_date"],
    }
  );

export type SaveAnnouncementInput = z.infer<typeof saveAnnouncementSchema>;
