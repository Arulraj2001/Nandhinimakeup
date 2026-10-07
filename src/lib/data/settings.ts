import { cacheTag } from "next/cache";
import { getStatelessClient } from "@/lib/supabase/stateless";
import { CACHE_TAGS } from "@/lib/utils/revalidate";
import {
  type SiteSettingsData,
  type BusinessSettings,
  type SocialSettings,
  type PaymentsSettings,
  type ShippingSettings,
  type BrandingSettings,
  type AnalyticsSettings,
  type HomeSettings,
  type AboutSettings,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_SOCIAL_SETTINGS,
  DEFAULT_PAYMENTS_SETTINGS,
  DEFAULT_SHIPPING_SETTINGS,
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_ANALYTICS_SETTINGS,
  DEFAULT_HOME_SETTINGS,
  DEFAULT_ABOUT_SETTINGS,
} from "@/types/settings";
import type { Database } from "@/types/database";

export type MediaRow = Database["public"]["Tables"]["media"]["Row"];

/**
 * Returns public site settings using the stateless Supabase client.
 * Cached with the 'settings' tag. Safe defaults when empty or missing.
 */
export async function getPublicSiteSettings(): Promise<SiteSettingsData> {
  "use cache";
  cacheTag(CACHE_TAGS.settings);

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value");

  if (error || !data) {
    return { ...DEFAULT_SITE_SETTINGS };
  }

  const map = new Map<string, unknown>();
  for (const row of data) {
    map.set(row.key, row.value);
  }

  const rawBusiness = map.get("business") as
    Record<string, unknown> | undefined;
  const business: BusinessSettings = rawBusiness
    ? {
        ...DEFAULT_BUSINESS_SETTINGS,
        ...rawBusiness,
        opening_hours: {
          ...DEFAULT_BUSINESS_SETTINGS.opening_hours,
          ...((rawBusiness.opening_hours as Record<string, unknown>) || {}),
        },
      }
    : DEFAULT_BUSINESS_SETTINGS;

  const rawSocial = map.get("social") as Record<string, unknown> | undefined;
  const social: SocialSettings = rawSocial
    ? { ...DEFAULT_SOCIAL_SETTINGS, ...rawSocial }
    : DEFAULT_SOCIAL_SETTINGS;

  const rawPayments = map.get("payments") as
    Record<string, unknown> | undefined;
  const payments: PaymentsSettings = rawPayments
    ? { ...DEFAULT_PAYMENTS_SETTINGS, ...rawPayments }
    : DEFAULT_PAYMENTS_SETTINGS;

  const rawShipping = map.get("shipping") as
    Record<string, unknown> | undefined;
  const shipping: ShippingSettings = rawShipping
    ? {
        ...DEFAULT_SHIPPING_SETTINGS,
        ...rawShipping,
        accept_orders:
          typeof rawShipping.accept_orders === "boolean"
            ? rawShipping.accept_orders
            : DEFAULT_SHIPPING_SETTINGS.accept_orders,
        order_number_prefix:
          typeof rawShipping.order_number_prefix === "string" &&
          rawShipping.order_number_prefix.trim().length >= 2
            ? rawShipping.order_number_prefix.trim().toUpperCase()
            : DEFAULT_SHIPPING_SETTINGS.order_number_prefix,
      }
    : DEFAULT_SHIPPING_SETTINGS;

  const rawBranding = map.get("branding") as
    Record<string, unknown> | undefined;
  const branding: BrandingSettings = rawBranding
    ? { ...DEFAULT_BRANDING_SETTINGS, ...rawBranding }
    : DEFAULT_BRANDING_SETTINGS;

  const rawAnalytics = map.get("analytics") as
    Record<string, unknown> | undefined;
  const analytics: AnalyticsSettings = rawAnalytics
    ? { ...DEFAULT_ANALYTICS_SETTINGS, ...rawAnalytics }
    : DEFAULT_ANALYTICS_SETTINGS;

  const rawHome = map.get("home") as Record<string, unknown> | undefined;
  const home: HomeSettings = rawHome
    ? {
        ...DEFAULT_HOME_SETTINGS,
        ...rawHome,
        counters: Array.isArray(rawHome.counters)
          ? rawHome.counters
          : DEFAULT_HOME_SETTINGS.counters,
      }
    : DEFAULT_HOME_SETTINGS;

  const rawAbout = map.get("about") as Record<string, unknown> | undefined;
  const about: AboutSettings = rawAbout
    ? {
        ...DEFAULT_ABOUT_SETTINGS,
        ...rawAbout,
        highlights: Array.isArray(rawAbout.highlights)
          ? rawAbout.highlights
          : DEFAULT_ABOUT_SETTINGS.highlights,
      }
    : DEFAULT_ABOUT_SETTINGS;

  return {
    business,
    social,
    payments,
    shipping,
    branding,
    analytics,
    home,
    about,
  };
}

/**
 * Fetches media record for public pages (e.g. logo, portrait, etc.)
 */
export async function getPublicMedia(
  mediaId: string | null | undefined
): Promise<MediaRow | null> {
  "use cache";
  cacheTag(CACHE_TAGS.media);

  if (!mediaId) return null;

  const supabase = getStatelessClient();
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("id", mediaId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
