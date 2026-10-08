import { z } from "zod";
import type { Database } from "@/types/database";

export type ProductCategory =
  Database["public"]["Tables"]["product_categories"]["Row"];
export type ProductCategoryWithImage = ProductCategory & {
  image?: Database["public"]["Tables"]["media"]["Row"] | null;
};

export const saveProductCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  image_id: z.string().uuid().nullable(),
  sort_order: z.number().int(),
  is_published: z.boolean(),
  seo_title: z
    .string()
    .trim()
    .max(70, "SEO title must not exceed 70 characters")
    .nullable()
    .optional(),
  seo_description: z
    .string()
    .trim()
    .max(200, "SEO description must not exceed 200 characters")
    .nullable()
    .optional(),
  seo_social_image_id: z
    .string()
    .uuid("Invalid image ID")
    .nullable()
    .optional(),
  noindex: z.boolean(),
  focus_keyword: z.string().trim().nullable().optional(),
});

export type SaveProductCategoryInput = z.infer<
  typeof saveProductCategorySchema
>;
