import { z } from "zod";
import type { Database } from "@/types/database";

export type ServiceCategory =
  Database["public"]["Tables"]["service_categories"]["Row"];
export type ServiceItem = Database["public"]["Tables"]["services"]["Row"];
export type ServiceWithCategory = ServiceItem & {
  category?: ServiceCategory | null;
  image?: Database["public"]["Tables"]["media"]["Row"] | null;
};

// Category Schema
export const saveCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  sort_order: z.number().int(),
  is_published: z.boolean(),
});

export type SaveCategoryInput = z.infer<typeof saveCategorySchema>;

// Service Schema
export const saveServiceSchema = z
  .object({
    id: z.string().uuid().optional(),
    category_id: z.string().uuid("Please select a category"),
    name: z.string().min(1, "Service name is required"),
    slug: z.string().min(1, "Slug is required"),
    short_description: z.string(),
    long_description: z.string(),
    price_type: z.enum(["fixed", "starting_from", "on_request"]),
    price: z.number().min(0, "Price must be non-negative").nullable(),
    duration_minutes: z.number().positive().nullable(),
    image_id: z.string().uuid().nullable(),
    includes_list: z.array(z.string()),
    is_featured: z.boolean(),
    is_published: z.boolean(),
    sort_order: z.number().int(),
  })
  .refine(
    (data) => {
      if (data.price_type !== "on_request") {
        return typeof data.price === "number" && data.price >= 0;
      }
      return true;
    },
    {
      message: "Price is required unless price type is 'on request'",
      path: ["price"],
    }
  );

export type SaveServiceInput = z.infer<typeof saveServiceSchema>;
