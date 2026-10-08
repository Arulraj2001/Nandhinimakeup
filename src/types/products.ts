import { z } from "zod";
import type { Database } from "@/types/database";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductImage =
  Database["public"]["Tables"]["product_images"]["Row"];
export type StockStatus = "in_stock" | "out_of_stock" | "made_to_order";

export type ProductWithDetails = Product & {
  category?: Database["public"]["Tables"]["product_categories"]["Row"] | null;
  images: Array<{
    id: string;
    media_id: string;
    sort_order: number;
    media: Database["public"]["Tables"]["media"]["Row"];
  }>;
};

export const saveProductSchema = z
  .object({
    id: z.string().uuid().optional(),
    category_id: z.string().uuid("Please select a category"),
    name: z.string().min(1, "Product name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string(),
    price: z.number().positive("Price must be greater than zero"),
    sale_price: z.number().positive("Sale price must be positive").nullable(),
    sku: z.string().nullable(),
    stock_status: z.enum(["in_stock", "out_of_stock", "made_to_order"]),
    stock_quantity: z
      .number()
      .int()
      .min(0, "Stock quantity cannot be negative")
      .nullable(),
    image_ids: z.array(z.string().uuid()),
    is_featured: z.boolean(),
    is_new: z.boolean(),
    is_published: z.boolean(),
    sort_order: z.number().int(),
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
  })
  .refine(
    (data) => {
      if (data.sale_price !== null && data.sale_price !== undefined) {
        return data.sale_price < data.price;
      }
      return true;
    },
    {
      message: "Sale price must be lower than the regular price",
      path: ["sale_price"],
    }
  )
  .refine(
    (data) => {
      if (
        data.is_published &&
        (!data.image_ids || data.image_ids.length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "A product cannot be published without at least one image",
      path: ["is_published"],
    }
  );

export type SaveProductInput = z.infer<typeof saveProductSchema>;
