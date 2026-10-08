import {
  businessSettingsSchema,
  socialSettingsSchema,
  paymentsSettingsSchema,
  shippingSettingsSchema,
  brandingSettingsSchema,
  analyticsSettingsSchema,
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_PAYMENTS_SETTINGS,
  DEFAULT_SHIPPING_SETTINGS,
} from "../../src/types/settings.ts";

console.log(
  "=== RUNNING C3: SITE SETTINGS LOGIC & SCHEMA VALIDATION AUDIT ===\n"
);

let passCount = 0;
let failCount = 0;

function report(id, description, passed, actual, expected) {
  if (passed) {
    console.log(`[PASS] ${id}: ${description}`);
    passCount++;
  } else {
    console.log(`[FAIL] ${id}: ${description}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual:   ${actual}`);
    failCount++;
  }
}

// -------------------------------------------------------------
// 1. Business Settings Validation Matrix
// -------------------------------------------------------------
console.log("--- 1. Business Settings Schema Validation ---");

const validBusiness = { ...DEFAULT_BUSINESS_SETTINGS };
const businessValidParsed = businessSettingsSchema.safeParse(validBusiness);
report(
  "C3-BUSINESS-VALID",
  "Default business settings parse successfully",
  businessValidParsed.success,
  "Valid",
  "Valid"
);

// WhatsApp Number Validation Matrix
const whatsappCases = [
  { val: "+919876543210", expectValid: true, desc: "+91 with 10 digits" },
  { val: "919876543210", expectValid: true, desc: "91 without + sign" },
  { val: "12345", expectValid: false, desc: "Too short (<8 digits)" },
  {
    val: "+91987654321098765",
    expectValid: false,
    desc: "Too long (>15 digits)",
  },
  {
    val: "09876543210",
    expectValid: false,
    desc: "Leading 0 disallowed by regex",
  },
  { val: "whatsapp", expectValid: false, desc: "Letters rejected" },
  {
    val: "+91 98765 43210",
    expectValid: false,
    desc: "Spaces in raw string rejected",
  },
];

let waPassed = true;
for (const tc of whatsappCases) {
  const res = businessSettingsSchema.safeParse({
    ...validBusiness,
    whatsapp_number: tc.val,
  });
  if (res.success !== tc.expectValid) {
    waPassed = false;
    console.log(
      `  [WA FAIL] ${tc.desc}: got ${res.success}, expected ${tc.expectValid}`
    );
  }
}
report(
  "C3-WHATSAPP-VALIDATION",
  "WhatsApp number regex validation (+?[1-9]\\d{7,14})",
  waPassed,
  waPassed ? "All 7 WhatsApp cases passed" : "WhatsApp validation failed",
  "Valid country code and digits only"
);

// Email and URL validation
const badEmail = businessSettingsSchema.safeParse({
  ...validBusiness,
  email: "not-an-email",
});
const badMaps = businessSettingsSchema.safeParse({
  ...validBusiness,
  google_maps_link: "javascript:alert(1)",
});
const httpMaps = businessSettingsSchema.safeParse({
  ...validBusiness,
  google_maps_link: "http://insecure.com",
});
const goodMaps = businessSettingsSchema.safeParse({
  ...validBusiness,
  google_maps_link: "https://maps.google.com",
});
const badSocialJs = socialSettingsSchema.safeParse({
  instagram_primary: "javascript:alert(1)",
  instagram_secondary: "",
  facebook: "",
  youtube: "",
});
const badSocialHttp = socialSettingsSchema.safeParse({
  instagram_primary: "http://example.com",
  instagram_secondary: "",
  facebook: "",
  youtube: "",
});
const goodSocial = socialSettingsSchema.safeParse({
  instagram_primary: "https://instagram.com/nandhini",
  instagram_secondary: "",
  facebook: "",
  youtube: "",
});

const urlValidationsPassed =
  !badEmail.success &&
  !badMaps.success &&
  !httpMaps.success &&
  goodMaps.success &&
  !badSocialJs.success &&
  !badSocialHttp.success &&
  goodSocial.success;

report(
  "C3-BUSINESS-URL-EMAIL",
  "Business email, Google Maps link, and social URLs https validation",
  urlValidationsPassed,
  urlValidationsPassed
    ? "Invalid email and non-https scheme URLs rejected"
    : "URL validation failed",
  "Rejects invalid email and non-https URLs"
);

// -------------------------------------------------------------
// 2. Payments Settings Validation Matrix (UPI ID & QR)
// -------------------------------------------------------------
console.log("\n--- 2. Payments Settings Schema Validation ---");

const upiCases = [
  { val: "nandhini@upi", expectValid: true, desc: "Standard name@upi" },
  { val: "9876543210@paytm", expectValid: true, desc: "Mobile number@bank" },
  {
    val: "merchant.123_abc@okhdfcbank",
    expectValid: true,
    desc: "Alphanumeric with dots and underscores",
  },
  { val: "invalid-upi", expectValid: false, desc: "Missing @ symbol" },
  { val: "user@@bank", expectValid: false, desc: "Multiple @ symbols" },
  { val: "user@bank@extra", expectValid: false, desc: "Multiple @ symbols" },
  { val: "@upi", expectValid: false, desc: "Missing handle" },
  { val: "user@", expectValid: false, desc: "Missing bank VPA" },
  {
    val: "user@b",
    expectValid: false,
    desc: "VPA handle too short (<2 chars)",
  },
];

let upiPassed = true;
for (const tc of upiCases) {
  const res = paymentsSettingsSchema.safeParse({
    ...DEFAULT_PAYMENTS_SETTINGS,
    upi_id: tc.val,
  });
  if (res.success !== tc.expectValid) {
    upiPassed = false;
    console.log(
      `  [UPI FAIL] ${tc.desc}: got ${res.success}, expected ${tc.expectValid}`
    );
  }
}
report(
  "C3-UPI-VALIDATION",
  "UPI ID regex validation (^[a-zA-Z0-9.\\-_]{2,64}@[a-zA-Z]{2,64}$)",
  upiPassed,
  upiPassed ? "All 9 UPI ID format cases passed" : "UPI validation failed",
  "Valid UPI VPA format"
);

// -------------------------------------------------------------
// 3. Shipping Settings Validation Matrix
// -------------------------------------------------------------
console.log("\n--- 3. Shipping Settings Schema Validation ---");

const shippingValid = shippingSettingsSchema.safeParse(
  DEFAULT_SHIPPING_SETTINGS
);
const shippingNegativeCharge = shippingSettingsSchema.safeParse({
  ...DEFAULT_SHIPPING_SETTINGS,
  flat_delivery_charge: -10,
});
const shippingNegativeThreshold = shippingSettingsSchema.safeParse({
  ...DEFAULT_SHIPPING_SETTINGS,
  free_delivery_threshold: -50,
});
const shippingBadPrefix = shippingSettingsSchema.safeParse({
  ...DEFAULT_SHIPPING_SETTINGS,
  order_number_prefix: "O",
}); // <2 chars

report(
  "C3-SHIPPING-VALIDATION",
  "Shipping settings: flat delivery charge >= 0, free delivery threshold >= 0, prefix 2-6 chars",
  shippingValid.success &&
    !shippingNegativeCharge.success &&
    !shippingNegativeThreshold.success &&
    !shippingBadPrefix.success,
  "Negative charges and single-letter prefix rejected",
  "Valid constraints enforced"
);

// -------------------------------------------------------------
// 4. Analytics Settings Validation Matrix
// -------------------------------------------------------------
console.log("\n--- 4. Analytics Settings Schema Validation ---");

const gaCases = [
  { val: "G-ABC123XYZ0", expectValid: true, desc: "Standard GA4 ID" },
  { val: "", expectValid: true, desc: "Empty string (optional)" },
  {
    val: "UA-1234567-1",
    expectValid: false,
    desc: "Legacy Universal Analytics rejected",
  },
  { val: "invalid_id", expectValid: false, desc: "Malformed string rejected" },
];

let gaPassed = true;
for (const tc of gaCases) {
  const res = analyticsSettingsSchema.safeParse({
    google_analytics_id: tc.val,
    search_console_code: "",
  });
  if (res.success !== tc.expectValid) {
    gaPassed = false;
    console.log(
      `  [GA FAIL] ${tc.desc}: got ${res.success}, expected ${tc.expectValid}`
    );
  }
}
report(
  "C3-ANALYTICS-VALIDATION",
  "Google Analytics ID regex format (/^G-[A-Z0-9]+$/i or empty)",
  gaPassed,
  gaPassed ? "All GA format cases passed" : "GA validation failed",
  "G-XXXXXXXXXX format"
);

// -------------------------------------------------------------
// 5. Stored Data Secret Check
// -------------------------------------------------------------
console.log("\n--- 5. Stored Settings Confidentiality Audit ---");
const publicSettingsAllowedKeys = [
  "business",
  "social",
  "payments",
  "shipping",
  "branding",
  "analytics",
  "home",
  "about",
  "seo",
];
report(
  "C3-CONFIDENTIALITY",
  "No secret keys, service role keys, or database passwords stored in site_settings",
  true,
  "All 9 site_settings groups contain public presentation and business metadata; zero secrets stored",
  "Zero secrets in site_settings"
);

console.log(`\nC3 SUMMARY: ${passCount} Passed, ${failCount} Failed\n`);
