import type { Database } from "@/types/database";
import type { MediaItem } from "@/lib/actions/media";
import type { RichTextDoc } from "@/lib/utils/rich-text";

export type BlogCategory = Database["public"]["Tables"]["blog_categories"]["Row"];
export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];

export interface BlogPostWithDetails extends Omit<BlogPost, "content"> {
  content: RichTextDoc;
  category: BlogCategory | null;
  featured_image: MediaItem | null;
}
