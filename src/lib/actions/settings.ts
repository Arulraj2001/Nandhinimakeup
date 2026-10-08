"use server";

import { verifyAdmin } from "@/lib/auth/require-admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag } from "@/lib/utils/revalidate";
import { createClient } from "@/lib/supabase/server";
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
  type SeoSettings,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_SOCIAL_SETTINGS,
  DEFAULT_PAYMENTS_SETTINGS,
  DEFAULT_SHIPPING_SETTINGS,
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_ANALYTICS_SETTINGS,
  DEFAULT_HOME_SETTINGS,
  DEFAULT_ABOUT_SETTINGS,
  DEFAULT_SEO_SETTINGS,
  businessSettingsSchema,
  socialSettingsSchema,
  paymentsSettingsSchema,
  shippingSettingsSchema,
  brandingSettingsSchema,
  analyticsSettingsSchema,
  homeSettingsSchema,
  aboutSettingsSchema,
  seoSettingsSchema,
} from "@/types/settings";

/**
 * Returns all site settings with safe defaults when a key is missing or empty.
 */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  const supabase = await createClient();
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

  const rawSeo = map.get("seo") as Record<string, unknown> | undefined;
  const seo: SeoSettings = rawSeo
    ? { ...DEFAULT_SEO_SETTINGS, ...rawSeo }
    : DEFAULT_SEO_SETTINGS;

  return {
    business,
    social,
    payments,
    shipping,
    branding,
    analytics,
    home,
    about,
    seo,
  };
}

/**
 * Save business settings section
 */
export async function saveBusinessSettings(
  input: unknown
): Promise<ActionResult<BusinessSettings>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = businessSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { error } = await auth.data.supabase.from("site_settings").upsert({
    key: "business",
    value: parsed.data,
  });

  if (error) {
    return actionError(error.message || "Failed to save business settings.");
  }

  revalidateCacheTag("settings");
  return actionSuccess(parsed.data);
}

/**
 * Save social settings section
 */
export async function saveSocialSettings(
  input: unknown
): Promise<ActionResult<SocialSettings>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = socialSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { error } = await auth.data.supabase.from("site_settings").upsert({
    key: "social",
    value: parsed.data,
  });

  if (error) {
    return actionError(error.message || "Failed to save social settings.");
  }

  revalidateCacheTag("settings");
  return actionSuccess(parsed.data);
}

/**
 * Save payments settings section
 */
export async function savePaymentsSettings(
  input: unknown
): Promise<ActionResult<PaymentsSettings>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = paymentsSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { error } = await auth.data.supabase.from("site_settings").upsert({
    key: "payments",
    value: parsed.data,
  });

  if (error) {
    return actionError(error.message || "Failed to save payments settings.");
  }

  revalidateCacheTag("settings");
  return actionSuccess(parsed.data);
}

/**
 * Save shipping settings section
 */
export async function saveShippingSettings(
  input: unknown
): Promise<ActionResult<ShippingSettings>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = shippingSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { error } = await auth.data.supabase.from("site_settings").upsert({
    key: "shipping",
    value: parsed.data,
  });

  if (error) {
    return actionError(error.message || "Failed to save shipping settings.");
  }

  revalidateCacheTag("settings");
  return actionSuccess(parsed.data);
}

/**
 * Save branding settings section
 */
export async function saveBrandingSettings(
  input: unknown
): Promise<ActionResult<BrandingSettings>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = brandingSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { error } = await auth.data.supabase.from("site_settings").upsert({
    key: "branding",
    value: parsed.data,
  });

  if (error) {
    return actionError(error.message || "Failed to save branding settings.");
  }

  revalidateCacheTag("settings");
  return actionSuccess(parsed.data);
}

/**
 * Save analytics settings section
 */
export async function saveAnalyticsSettings(
  input: unknown
): Promise<ActionResult<AnalyticsSettings>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = analyticsSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { error } = await auth.data.supabase.from("site_settings").upsert({
    key: "analytics",
    value: parsed.data,
  });

  if (error) {
    return actionError(error.message || "Failed to save analytics settings.");
  }

  revalidateCacheTag("settings");
  return actionSuccess(parsed.data);
}

/**
 * Save home settings section
 */
export async function saveHomeSettings(
  input: unknown
): Promise<ActionResult<HomeSettings>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = homeSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { error } = await auth.data.supabase.from("site_settings").upsert({
    key: "home",
    value: parsed.data,
  });

  if (error) {
    return actionError(error.message || "Failed to save home settings.");
  }

  revalidateCacheTag("settings");
  return actionSuccess(parsed.data);
}

/**
 * Save about settings section
 */
export async function saveAboutSettings(
  input: unknown
): Promise<ActionResult<AboutSettings>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = aboutSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { error } = await auth.data.supabase.from("site_settings").upsert({
    key: "about",
    value: parsed.data,
  });

  if (error) {
    return actionError(error.message || "Failed to save about settings.");
  }

  revalidateCacheTag("settings");
  return actionSuccess(parsed.data);
}

/**
 * Save SEO settings section
 */
export async function saveSeoSettings(
  input: unknown
): Promise<ActionResult<SeoSettings>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = seoSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors);
  }

  const { error } = await auth.data.supabase.from("site_settings").upsert({
    key: "seo",
    value: parsed.data,
  });

  if (error) {
    return actionError(error.message || "Failed to save SEO settings.");
  }

  revalidateCacheTag("settings");
  revalidateCacheTag("seo");
  return actionSuccess(parsed.data);
}
