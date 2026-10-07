import { env } from "@/lib/config/env";

/**
 * Returns the public CDN URL for a file stored in Supabase storage bucket 'media'.
 */
export function getPublicMediaUrl(storagePath: string): string {
  if (!storagePath) return "";
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
  return `${baseUrl}/storage/v1/object/public/media/${storagePath}`;
}
