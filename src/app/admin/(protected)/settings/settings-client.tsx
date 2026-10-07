/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  type SiteSettingsData,
  type BusinessSettings,
  type SocialSettings,
  type PaymentsSettings,
  type ShippingSettings,
  type BrandingSettings,
  type AnalyticsSettings,
  businessSettingsSchema,
  socialSettingsSchema,
  paymentsSettingsSchema,
  shippingSettingsSchema,
  brandingSettingsSchema,
  analyticsSettingsSchema,
} from "@/types/settings";
import {
  saveBusinessSettings,
  saveSocialSettings,
  savePaymentsSettings,
  saveShippingSettings,
  saveBrandingSettings,
  saveAnalyticsSettings,
} from "@/lib/actions/settings";
import {
  MediaPicker,
  getPublicMediaUrl,
} from "@/components/admin/media-picker";
import type { MediaItem } from "@/lib/actions/media";
import {
  FormField,
  SubmitButton,
  useUnsavedChangesWarning,
} from "@/components/admin/form-helpers";
import { formatINR } from "@/lib/utils/currency";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SettingsClientProps {
  initialSettings: SiteSettingsData;
  initialMediaMap: Record<string, MediaItem>;
}

type SettingsTab =
  "business" | "social" | "payments" | "shipping" | "branding" | "analytics";

export function SettingsClient({
  initialSettings,
  initialMediaMap,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("business");
  const [mediaMap, setMediaMap] =
    React.useState<Record<string, MediaItem>>(initialMediaMap);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "business", label: "Business Details" },
    { id: "social", label: "Social Media" },
    { id: "payments", label: "Payments (UPI)" },
    { id: "shipping", label: "Shipping" },
    { id: "branding", label: "Branding" },
    { id: "analytics", label: "Analytics & SEO" },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-border border-b">
        <nav
          className="flex space-x-2 overflow-x-auto pb-px"
          aria-label="Settings tabs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "text-foreground/70 hover:text-foreground border-transparent"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="bg-card text-card-foreground border-border rounded-lg border p-6 shadow-sm">
        {activeTab === "business" && (
          <BusinessSettingsForm initialValues={initialSettings.business} />
        )}
        {activeTab === "social" && (
          <SocialSettingsForm initialValues={initialSettings.social} />
        )}
        {activeTab === "payments" && (
          <PaymentsSettingsForm
            initialValues={initialSettings.payments}
            mediaMap={mediaMap}
            onMediaMapUpdate={(newItem) =>
              setMediaMap((prev) => ({ ...prev, [newItem.id]: newItem }))
            }
          />
        )}
        {activeTab === "shipping" && (
          <ShippingSettingsForm initialValues={initialSettings.shipping} />
        )}
        {activeTab === "branding" && (
          <BrandingSettingsForm
            initialValues={initialSettings.branding}
            mediaMap={mediaMap}
            onMediaMapUpdate={(newItem) =>
              setMediaMap((prev) => ({ ...prev, [newItem.id]: newItem }))
            }
          />
        )}
        {activeTab === "analytics" && (
          <AnalyticsSettingsForm initialValues={initialSettings.analytics} />
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 1. Business Form
// ----------------------------------------------------------------------
const WEEKDAYS: {
  key: keyof BusinessSettings["opening_hours"];
  label: string;
}[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function BusinessSettingsForm({
  initialValues,
}: {
  initialValues: BusinessSettings;
}) {
  const form = useForm<BusinessSettings>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: initialValues,
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: BusinessSettings) => {
    const res = await saveBusinessSettings(values);
    if (!res.success) {
      toast.error(res.error || "Failed to save business settings");
      if (res.fieldErrors) {
        Object.entries(res.fieldErrors).forEach(([field, msgs]) => {
          if (msgs && msgs[0]) {
            form.setError(
              field as unknown as `opening_hours.${keyof BusinessSettings["opening_hours"]}`,
              {
                message: msgs[0],
              }
            );
          }
        });
      }
      return;
    }
    toast.success("Business settings saved successfully");
    form.reset(res.data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="border-border border-b pb-4">
        <h2 className="text-foreground text-lg font-semibold">
          Business Details
        </h2>
        <p className="text-foreground/70 text-sm">
          Core company identity, contact numbers, address, and operating hours.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          id="business_name"
          label="Business Name"
          required
          error={form.formState.errors.business_name?.message}
        >
          <Input
            id="business_name"
            {...form.register("business_name")}
            placeholder="Nandhini Makeup & Jewellery"
          />
        </FormField>

        <FormField
          id="tagline"
          label="Tagline"
          error={form.formState.errors.tagline?.message}
        >
          <Input
            id="tagline"
            {...form.register("tagline")}
            placeholder="Bridal Makeup & Premium Jewellery"
          />
        </FormField>

        <FormField
          id="phone"
          label="Phone Number"
          required
          error={form.formState.errors.phone?.message}
        >
          <Input
            id="phone"
            {...form.register("phone")}
            placeholder="+91 98765 43210"
          />
        </FormField>

        <FormField
          id="whatsapp_number"
          label="WhatsApp Number (with country code)"
          required
          hint="Digits with country code, e.g. +919876543210"
          error={form.formState.errors.whatsapp_number?.message}
        >
          <Input
            id="whatsapp_number"
            {...form.register("whatsapp_number")}
            placeholder="+919876543210"
          />
        </FormField>

        <FormField
          id="email"
          label="Email Address"
          required
          error={form.formState.errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="contact@nandhinimakeup.com"
          />
        </FormField>

        <FormField
          id="google_maps_link"
          label="Google Maps URL"
          hint="Direct link to business location on Google Maps"
          error={form.formState.errors.google_maps_link?.message}
        >
          <Input
            id="google_maps_link"
            type="url"
            {...form.register("google_maps_link")}
            placeholder="https://maps.google.com/?q=..."
          />
        </FormField>
      </div>

      <FormField
        id="full_address"
        label="Full Business Address"
        error={form.formState.errors.full_address?.message}
      >
        <textarea
          id="full_address"
          rows={3}
          {...form.register("full_address")}
          className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border p-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
          placeholder="Shop 4, Gandhi Road, Chennai, Tamil Nadu - 600001"
        />
      </FormField>

      {/* Opening Hours */}
      <div className="space-y-4">
        <div>
          <h3 className="text-foreground text-sm font-semibold">
            Opening Hours
          </h3>
          <p className="text-foreground/70 text-xs">
            Set opening and closing times for each day of the week, or mark as
            closed.
          </p>
        </div>

        <div className="border-border divide-border divide-y rounded-md border text-sm">
          {WEEKDAYS.map(({ key, label }) => {
            const isClosed = form.watch(`opening_hours.${key}.isClosed`);
            return (
              <div
                key={key}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="w-28 font-medium">{label}</div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      {...form.register(`opening_hours.${key}.isClosed`)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs">Closed</span>
                  </label>

                  {!isClosed && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        {...form.register(`opening_hours.${key}.openTime`)}
                        className="h-8 w-28 text-xs"
                      />
                      <span className="text-foreground/60 text-xs">to</span>
                      <Input
                        type="time"
                        {...form.register(`opening_hours.${key}.closeTime`)}
                        className="h-8 w-28 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <SubmitButton
          isLoading={form.formState.isSubmitting}
          label="Save Business Details"
        />
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------
// 2. Social Form
// ----------------------------------------------------------------------
function SocialSettingsForm({
  initialValues,
}: {
  initialValues: SocialSettings;
}) {
  const form = useForm<SocialSettings>({
    resolver: zodResolver(socialSettingsSchema),
    defaultValues: initialValues,
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: SocialSettings) => {
    const res = await saveSocialSettings(values);
    if (!res.success) {
      toast.error(res.error || "Failed to save social settings");
      return;
    }
    toast.success("Social media settings saved successfully");
    form.reset(res.data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="border-border border-b pb-4">
        <h2 className="text-foreground text-lg font-semibold">
          Social Media Links
        </h2>
        <p className="text-foreground/70 text-sm">
          Connect your Instagram, Facebook, and YouTube channels. All links are
          optional.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          id="instagram_primary"
          label="Instagram Profile 1 (Primary)"
          hint="e.g. https://instagram.com/nandhinimakeup"
          error={form.formState.errors.instagram_primary?.message}
        >
          <Input
            id="instagram_primary"
            type="url"
            {...form.register("instagram_primary")}
            placeholder="https://instagram.com/..."
          />
        </FormField>

        <FormField
          id="instagram_secondary"
          label="Instagram Profile 2 (Secondary / Jewellery)"
          hint="e.g. https://instagram.com/nandhinijewellery"
          error={form.formState.errors.instagram_secondary?.message}
        >
          <Input
            id="instagram_secondary"
            type="url"
            {...form.register("instagram_secondary")}
            placeholder="https://instagram.com/..."
          />
        </FormField>

        <FormField
          id="facebook"
          label="Facebook Page"
          hint="e.g. https://facebook.com/nandhinimakeup"
          error={form.formState.errors.facebook?.message}
        >
          <Input
            id="facebook"
            type="url"
            {...form.register("facebook")}
            placeholder="https://facebook.com/..."
          />
        </FormField>

        <FormField
          id="youtube"
          label="YouTube Channel"
          hint="e.g. https://youtube.com/@nandhinimakeup"
          error={form.formState.errors.youtube?.message}
        >
          <Input
            id="youtube"
            type="url"
            {...form.register("youtube")}
            placeholder="https://youtube.com/..."
          />
        </FormField>
      </div>

      <div className="flex justify-end pt-4">
        <SubmitButton
          isLoading={form.formState.isSubmitting}
          label="Save Social Media Links"
        />
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------
// 3. Payments Form
// ----------------------------------------------------------------------
function PaymentsSettingsForm({
  initialValues,
  mediaMap,
  onMediaMapUpdate,
}: {
  initialValues: PaymentsSettings;
  mediaMap: Record<string, MediaItem>;
  onMediaMapUpdate: (item: MediaItem) => void;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const form = useForm<PaymentsSettings>({
    resolver: zodResolver(paymentsSettingsSchema),
    defaultValues: initialValues,
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const qrMediaId = form.watch("upi_qr_media_id");
  const qrMedia = qrMediaId ? mediaMap[qrMediaId] : null;

  const onSubmit = async (values: PaymentsSettings) => {
    const res = await savePaymentsSettings(values);
    if (!res.success) {
      toast.error(res.error || "Failed to save payments settings");
      if (res.fieldErrors?.upi_id) {
        form.setError("upi_id", { message: res.fieldErrors.upi_id[0] });
      }
      return;
    }
    toast.success("Payments settings saved successfully");
    form.reset(res.data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="border-border border-b pb-4">
        <h2 className="text-foreground text-lg font-semibold">
          Payments & UPI
        </h2>
        <p className="text-foreground/70 text-sm">
          UPI ID and QR code configuration. Note: this group is publicly
          readable by design for customer checkout displays.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          id="upi_id"
          label="UPI ID (VPA)"
          required
          hint="Format: username@bank or mobile@upi (e.g. nandhini@okhdfcbank)"
          error={form.formState.errors.upi_id?.message}
        >
          <Input
            id="upi_id"
            {...form.register("upi_id")}
            placeholder="nandhini@okhdfcbank"
          />
        </FormField>

        <FormField
          id="payee_name"
          label="Payee Account Name"
          required
          hint="Name registered on bank account for verification"
          error={form.formState.errors.payee_name?.message}
        >
          <Input
            id="payee_name"
            {...form.register("payee_name")}
            placeholder="Nandhini Makeup Studio"
          />
        </FormField>
      </div>

      <div className="space-y-3">
        <label className="text-foreground text-sm font-medium">
          UPI QR Code Image
        </label>
        <p className="text-foreground/70 text-xs">
          Select or upload your official UPI QR code from the Media Library.
        </p>

        {qrMedia ? (
          <div className="flex items-center gap-4 rounded-md border p-3">
            <img
              src={getPublicMediaUrl(qrMedia.storage_path)}
              alt={qrMedia.alt_text}
              className="h-20 w-20 rounded border bg-white object-contain"
            />
            <div className="flex-1 space-y-1 text-sm">
              <p className="text-foreground font-medium">{qrMedia.file_name}</p>
              <p className="text-foreground/70 text-xs">
                {qrMedia.width}x{qrMedia.height} px
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                >
                  Change QR
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    form.setValue("upi_qr_media_id", null, {
                      shouldDirty: true,
                    });
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setPickerOpen(true)}
          >
            Select QR Code Image
          </Button>
        )}
      </div>

      <MediaPicker
        open={pickerOpen}
        mode="single"
        selectedIds={qrMediaId ? [qrMediaId] : []}
        onClose={() => setPickerOpen(false)}
        onSelect={(items) => {
          if (items.length > 0) {
            form.setValue("upi_qr_media_id", items[0].id, {
              shouldDirty: true,
            });
            onMediaMapUpdate(items[0]);
          }
          setPickerOpen(false);
        }}
      />

      <div className="flex justify-end pt-4">
        <SubmitButton
          isLoading={form.formState.isSubmitting}
          label="Save Payments Settings"
        />
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------
// 4. Shipping Form
// ----------------------------------------------------------------------
function ShippingSettingsForm({
  initialValues,
}: {
  initialValues: ShippingSettings;
}) {
  const form = useForm<ShippingSettings>({
    resolver: zodResolver(shippingSettingsSchema),
    defaultValues: initialValues,
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const flatRate = form.watch("flat_delivery_charge");
  const freeThreshold = form.watch("free_delivery_threshold");

  const onSubmit = async (values: ShippingSettings) => {
    const res = await saveShippingSettings(values);
    if (!res.success) {
      toast.error(res.error || "Failed to save shipping settings");
      return;
    }
    toast.success("Shipping settings saved successfully");
    form.reset(res.data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="border-border border-b pb-4">
        <h2 className="text-foreground text-lg font-semibold">
          Shipping & Delivery Charges
        </h2>
        <p className="text-foreground/70 text-sm">
          Configure default domestic shipping rates and free delivery thresholds
          in Indian Rupees.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          id="flat_delivery_charge"
          label="Flat Delivery Charge (₹)"
          required
          hint={`Current standard rate: ${formatINR(Number(flatRate) || 0)}`}
          error={form.formState.errors.flat_delivery_charge?.message}
        >
          <Input
            id="flat_delivery_charge"
            type="number"
            min="0"
            step="1"
            {...form.register("flat_delivery_charge", { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          id="free_delivery_threshold"
          label="Free Delivery Threshold (₹, optional)"
          hint={
            freeThreshold !== null &&
            freeThreshold !== undefined &&
            freeThreshold > 0
              ? `Orders above ${formatINR(Number(freeThreshold))} qualify for free shipping`
              : "Leave empty if free shipping is not offered"
          }
          error={form.formState.errors.free_delivery_threshold?.message}
        >
          <Input
            id="free_delivery_threshold"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 999"
            {...form.register("free_delivery_threshold", {
              setValueAs: (v) =>
                v === "" || v === null || v === undefined || isNaN(Number(v))
                  ? null
                  : Number(v),
            })}
          />
        </FormField>
      </div>

      <FormField
        id="delivery_note"
        label="Delivery Notice / Information"
        hint="Informational note shown to customers during order placement"
        error={form.formState.errors.delivery_note?.message}
      >
        <textarea
          id="delivery_note"
          rows={3}
          {...form.register("delivery_note")}
          className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border p-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
          placeholder="Delivered across India within 3-5 business days. Safe packaging guaranteed."
        />
      </FormField>

      <div className="flex justify-end pt-4">
        <SubmitButton
          isLoading={form.formState.isSubmitting}
          label="Save Shipping Settings"
        />
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------
// 5. Branding Form
// ----------------------------------------------------------------------
function BrandingSettingsForm({
  initialValues,
  mediaMap,
  onMediaMapUpdate,
}: {
  initialValues: BrandingSettings;
  mediaMap: Record<string, MediaItem>;
  onMediaMapUpdate: (item: MediaItem) => void;
}) {
  const [pickerTarget, setPickerTarget] = React.useState<
    "logo" | "favicon" | null
  >(null);

  const form = useForm<BrandingSettings>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: initialValues,
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const logoId = form.watch("logo_media_id");
  const faviconId = form.watch("favicon_media_id");

  const logoMedia = logoId ? mediaMap[logoId] : null;
  const faviconMedia = faviconId ? mediaMap[faviconId] : null;

  const onSubmit = async (values: BrandingSettings) => {
    const res = await saveBrandingSettings(values);
    if (!res.success) {
      toast.error(res.error || "Failed to save branding settings");
      return;
    }
    toast.success("Branding settings saved successfully");
    form.reset(res.data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="border-border border-b pb-4">
        <h2 className="text-foreground text-lg font-semibold">Branding</h2>
        <p className="text-foreground/70 text-sm">
          Upload and manage your brand logo and browser favicon via the Media
          Library.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Logo */}
        <div className="space-y-3 rounded-lg border p-4">
          <label className="text-foreground text-sm font-semibold">
            Brand Logo
          </label>
          <p className="text-foreground/70 text-xs">
            Used across the website header, invoice, and branding assets.
          </p>

          {logoMedia ? (
            <div className="flex items-center gap-4 pt-2">
              <img
                src={getPublicMediaUrl(logoMedia.storage_path)}
                alt={logoMedia.alt_text}
                className="h-16 w-16 rounded border bg-white object-contain"
              />
              <div className="space-y-1 text-xs">
                <p className="text-foreground font-medium">
                  {logoMedia.file_name}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerTarget("logo")}
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      form.setValue("logo_media_id", null, {
                        shouldDirty: true,
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPickerTarget("logo")}
            >
              Select Brand Logo
            </Button>
          )}
        </div>

        {/* Favicon */}
        <div className="space-y-3 rounded-lg border p-4">
          <label className="text-foreground text-sm font-semibold">
            Browser Favicon
          </label>
          <p className="text-foreground/70 text-xs">
            Shown on browser tabs and bookmarks. Square image recommended.
          </p>

          {faviconMedia ? (
            <div className="flex items-center gap-4 pt-2">
              <img
                src={getPublicMediaUrl(faviconMedia.storage_path)}
                alt={faviconMedia.alt_text}
                className="h-12 w-12 rounded border bg-white object-contain"
              />
              <div className="space-y-1 text-xs">
                <p className="text-foreground font-medium">
                  {faviconMedia.file_name}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerTarget("favicon")}
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      form.setValue("favicon_media_id", null, {
                        shouldDirty: true,
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPickerTarget("favicon")}
            >
              Select Favicon
            </Button>
          )}
        </div>
      </div>

      <MediaPicker
        open={pickerTarget !== null}
        mode="single"
        selectedIds={
          pickerTarget === "logo"
            ? logoId
              ? [logoId]
              : []
            : faviconId
              ? [faviconId]
              : []
        }
        onClose={() => setPickerTarget(null)}
        onSelect={(items) => {
          if (items.length > 0) {
            const item = items[0];
            if (pickerTarget === "logo") {
              form.setValue("logo_media_id", item.id, { shouldDirty: true });
            } else if (pickerTarget === "favicon") {
              form.setValue("favicon_media_id", item.id, { shouldDirty: true });
            }
            onMediaMapUpdate(item);
          }
          setPickerTarget(null);
        }}
      />

      <div className="flex justify-end pt-4">
        <SubmitButton
          isLoading={form.formState.isSubmitting}
          label="Save Branding Settings"
        />
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------
// 6. Analytics Form
// ----------------------------------------------------------------------
function AnalyticsSettingsForm({
  initialValues,
}: {
  initialValues: AnalyticsSettings;
}) {
  const form = useForm<AnalyticsSettings>({
    resolver: zodResolver(analyticsSettingsSchema),
    defaultValues: initialValues,
  });

  useUnsavedChangesWarning(form.formState.isDirty);

  const onSubmit = async (values: AnalyticsSettings) => {
    const res = await saveAnalyticsSettings(values);
    if (!res.success) {
      toast.error(res.error || "Failed to save analytics settings");
      if (res.fieldErrors?.google_analytics_id) {
        form.setError("google_analytics_id", {
          message: res.fieldErrors.google_analytics_id[0],
        });
      }
      return;
    }
    toast.success("Analytics settings saved successfully");
    form.reset(res.data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="border-border border-b pb-4">
        <h2 className="text-foreground text-lg font-semibold">
          Analytics & Search Console
        </h2>
        <p className="text-foreground/70 text-sm">
          Third-party tracking and site verification. Both fields are optional.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          id="google_analytics_id"
          label="Google Analytics Measurement ID"
          hint="Format: G-XXXXXXXXXX (e.g. G-ABC1234567)"
          error={form.formState.errors.google_analytics_id?.message}
        >
          <Input
            id="google_analytics_id"
            {...form.register("google_analytics_id")}
            placeholder="G-XXXXXXXXXX"
          />
        </FormField>

        <FormField
          id="search_console_code"
          label="Google Search Console Verification Code"
          hint="Verification token from your Search Console HTML tag or DNS"
          error={form.formState.errors.search_console_code?.message}
        >
          <Input
            id="search_console_code"
            {...form.register("search_console_code")}
            placeholder="google-site-verification=..."
          />
        </FormField>
      </div>

      <div className="flex justify-end pt-4">
        <SubmitButton
          isLoading={form.formState.isSubmitting}
          label="Save Analytics Settings"
        />
      </div>
    </form>
  );
}
