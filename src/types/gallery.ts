import { z } from "zod";
import type { Database } from "@/types/database";

export type GalleryItem = Database["public"]["Tables"]["gallery_items"]["Row"];

export type GalleryItemWithDetails = GalleryItem & {
  media?: Database["public"]["Tables"]["media"]["Row"] | null;
  before_media?: Database["public"]["Tables"]["media"]["Row"] | null;
  service_category?:
    Database["public"]["Tables"]["service_categories"]["Row"] | null;
};

export const saveGalleryItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    type: z.enum(["single", "before_after"]),
    media_id: z.string().uuid().nullable().optional(),
    before_media_id: z.string().uuid().nullable().optional(),
    title: z.string(),
    caption: z.string(),
    service_category_id: z.string().uuid().nullable().optional(),
    instagram_url: z.string().trim().nullable().optional(),
    is_featured: z.boolean(),
    is_published: z.boolean(),
    sort_order: z.number().int(),
  })
  .refine(
    (data) => {
      if (data.type === "before_after") {
        return Boolean(data.before_media_id && data.media_id);
      }
      return Boolean(data.media_id || data.instagram_url);
    },
    {
      message: "Please select an image or provide an Instagram Reel/Post link",
      path: ["media_id"],
    }
  );

export type SaveGalleryItemInput = z.infer<typeof saveGalleryItemSchema>;
