import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import type { Announcement } from "@/types/content";

/**
 * Returns currently active, live announcement if available.
 * Cached with 'announcements' tag.
 */
export async function getPublicActiveAnnouncement(): Promise<Announcement | null> {
  "use cache";
  cacheTag(CACHE_TAGS.announcements);

  const supabase = getStatelessClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Extra guard in case of time boundary edge conditions
  const curr = new Date();
  if (data.start_date && new Date(data.start_date) > curr) return null;
  if (data.end_date && new Date(data.end_date) < curr) return null;

  return data;
}
