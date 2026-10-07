import { z } from "zod";

export const dayScheduleSchema = z.object({
  isClosed: z.boolean(),
  openTime: z.string(),
  closeTime: z.string(),
});

export const weekdayHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
});

export type DaySchedule = z.infer<typeof dayScheduleSchema>;
export type WeekdayHours = z.infer<typeof weekdayHoursSchema>;

// 1. Business Schema
export const businessSettingsSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  tagline: z.string(),
  phone: z.string().min(1, "Phone number is required"),
  whatsapp_number: z
    .string()
    .min(1, "WhatsApp number is required")
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      "WhatsApp number must contain country code and digits only (e.g. +919876543210)"
    ),
  email: z.string().email("Invalid email address"),
  full_address: z.string(),
  street_address: z.string(),
  address_locality: z.string(),
  address_region: z.string(),
  postal_code: z.string(),
  google_maps_link: z.string().url("Must be a valid URL").or(z.literal("")),
  opening_hours: weekdayHoursSchema,
});

export type BusinessSettings = z.infer<typeof businessSettingsSchema>;

// 2. Social Schema
export const socialSettingsSchema = z.object({
  instagram_primary: z.string().url("Must be a valid URL").or(z.literal("")),
  instagram_secondary: z.string().url("Must be a valid URL").or(z.literal("")),
  facebook: z.string().url("Must be a valid URL").or(z.literal("")),
  youtube: z.string().url("Must be a valid URL").or(z.literal("")),
});

export type SocialSettings = z.infer<typeof socialSettingsSchema>;

// 3. Payments Schema
export const paymentsSettingsSchema = z.object({
  upi_id: z
    .string()
    .min(1, "UPI ID is required")
    .regex(
      /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,64}$/,
      "Invalid UPI ID format (e.g. name@upi or mobile@bank)"
    ),
  payee_name: z.string().min(1, "Payee name is required"),
  upi_qr_media_id: z.string().uuid("Invalid media ID").nullable(),
});

export type PaymentsSettings = z.infer<typeof paymentsSettingsSchema>;

// 4. Shipping Schema
export const shippingSettingsSchema = z.object({
  accept_orders: z.boolean(),
  order_number_prefix: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Prefix must be at least 2 characters")
    .max(6, "Prefix must be at most 6 characters")
    .regex(/^[A-Z0-9]+$/, "Prefix can only contain letters and digits"),
  flat_delivery_charge: z.number().min(0, "Delivery charge cannot be negative"),
  free_delivery_threshold: z
    .number()
    .min(0, "Threshold cannot be negative")
    .nullable(),
  delivery_note: z.string(),
});

export type ShippingSettings = z.infer<typeof shippingSettingsSchema>;

// 5. Branding Schema
export const brandingSettingsSchema = z.object({
  logo_media_id: z.string().uuid("Invalid media ID").nullable(),
  favicon_media_id: z.string().uuid("Invalid media ID").nullable(),
});

export type BrandingSettings = z.infer<typeof brandingSettingsSchema>;

// 6. Analytics Schema
export const analyticsSettingsSchema = z.object({
  google_analytics_id: z
    .string()
    .regex(
      /^G-[A-Z0-9]+$/i,
      "Google Analytics ID must match format G-XXXXXXXXXX"
    )
    .or(z.literal("")),
  search_console_code: z.string(),
});

export type AnalyticsSettings = z.infer<typeof analyticsSettingsSchema>;

// 7. Home Schema
export const homeCounterSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
  number: z.number().int().min(0, "Number must be 0 or greater"),
});

export const homeSettingsSchema = z.object({
  hero_headline: z.string().trim().min(1, "Hero headline is required"),
  hero_supporting_text: z.string().trim(),
  hero_image_id: z.string().uuid("Invalid media ID").nullable().optional(),
  hero_primary_button: z.enum(["services", "jewellery"]),
  counters: z.array(homeCounterSchema).max(3, "Maximum 3 counters allowed"),
  closing_cta_headline: z.string().trim(),
  closing_cta_text: z.string().trim(),
});

export type HomeCounter = z.infer<typeof homeCounterSchema>;
export type HomeSettings = z.infer<typeof homeSettingsSchema>;

// 8. About Schema
export const aboutSettingsSchema = z.object({
  story_text: z.string().trim(),
  portrait_image_id: z.string().uuid("Invalid media ID").nullable().optional(),
  highlights: z.array(z.string().trim()),
});

export type AboutSettings = z.infer<typeof aboutSettingsSchema>;

// 9. SEO Schema
export const seoSettingsSchema = z.object({
  default_meta_description: z.string().trim(),
  default_social_image_id: z.string().uuid("Invalid media ID").nullable(),
  price_range: z.string().trim(),
  area_served: z.string().trim(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export type SeoSettings = z.infer<typeof seoSettingsSchema>;

// Complete Site Settings Bundle
export type SiteSettingsData = {
  business: BusinessSettings;
  social: SocialSettings;
  payments: PaymentsSettings;
  shipping: ShippingSettings;
  branding: BrandingSettings;
  analytics: AnalyticsSettings;
  home: HomeSettings;
  about: AboutSettings;
  seo: SeoSettings;
};

// Safe Defaults
const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  isClosed: false,
  openTime: "09:00",
  closeTime: "20:00",
};

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  business_name: "Nandhini Makeup & Jewellery",
  tagline: "Bridal Makeup & Premium Jewellery",
  phone: "+919876543210",
  whatsapp_number: "+919876543210",
  email: "contact@nandhinimakeup.com",
  full_address: "Chennai, Tamil Nadu, India",
  street_address: "",
  address_locality: "",
  address_region: "",
  postal_code: "",
  google_maps_link: "",
  opening_hours: {
    monday: { ...DEFAULT_DAY_SCHEDULE },
    tuesday: { ...DEFAULT_DAY_SCHEDULE },
    wednesday: { ...DEFAULT_DAY_SCHEDULE },
    thursday: { ...DEFAULT_DAY_SCHEDULE },
    friday: { ...DEFAULT_DAY_SCHEDULE },
    saturday: { ...DEFAULT_DAY_SCHEDULE },
    sunday: { isClosed: true, openTime: "10:00", closeTime: "18:00" },
  },
};

export const DEFAULT_SOCIAL_SETTINGS: SocialSettings = {
  instagram_primary: "",
  instagram_secondary: "",
  facebook: "",
  youtube: "",
};

export const DEFAULT_PAYMENTS_SETTINGS: PaymentsSettings = {
  upi_id: "nandhini@upi",
  payee_name: "Nandhini Makeup",
  upi_qr_media_id: null,
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  accept_orders: true,
  order_number_prefix: "ORD",
  flat_delivery_charge: 50,
  free_delivery_threshold: 999,
  delivery_note: "Standard delivery across India within 3-5 business days.",
};

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  logo_media_id: null,
  favicon_media_id: null,
};

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  google_analytics_id: "",
  search_console_code: "",
};

export const DEFAULT_HOME_SETTINGS: HomeSettings = {
  hero_headline: "Elegance Crafted for Your Special Day",
  hero_supporting_text:
    "Professional bridal artistry and handcrafted jewellery that bring your dream look to life.",
  hero_image_id: null,
  hero_primary_button: "services",
  counters: [
    { label: "Brides Served", number: 500 },
    { label: "Years Experience", number: 8 },
    { label: "Happy Clients", number: 1200 },
  ],
  closing_cta_headline: "Ready to Create Your Dream Bridal Look?",
  closing_cta_text:
    "Book your consultation or enquire about bespoke jewellery pieces today.",
};

export const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  story_text:
    "Founded with a passion for beauty and tradition, Nandhini Makeup & Jewellery brings together expert bridal artistry and timeless jewellery creations. We believe every bride deserves to look and feel breathtaking on her special day.",
  portrait_image_id: null,
  highlights: [
    "Certified Professional Bridal Makeup Artist",
    "Over 8+ years of bridal transformation experience",
    "Handcrafted jewellery curated for special occasions",
    "On-location destination wedding services",
  ],
};

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  default_meta_description: "",
  default_social_image_id: null,
  price_range: "₹₹",
  area_served: "",
  latitude: null,
  longitude: null,
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  business: DEFAULT_BUSINESS_SETTINGS,
  social: DEFAULT_SOCIAL_SETTINGS,
  payments: DEFAULT_PAYMENTS_SETTINGS,
  shipping: DEFAULT_SHIPPING_SETTINGS,
  branding: DEFAULT_BRANDING_SETTINGS,
  analytics: DEFAULT_ANALYTICS_SETTINGS,
  home: DEFAULT_HOME_SETTINGS,
  about: DEFAULT_ABOUT_SETTINGS,
  seo: DEFAULT_SEO_SETTINGS,
};
