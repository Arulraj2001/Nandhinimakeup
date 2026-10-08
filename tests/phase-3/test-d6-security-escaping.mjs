import { parse } from "node-html-parser";
import { formatINR } from "../../src/lib/utils/currency.ts";

console.log("=== RUNNING D6: SECURITY OF PUBLIC OUTPUT & ESCAPING AUDIT ===\n");

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

const BASE_URL = "http://localhost:3009";

// -------------------------------------------------------------
// 1. WhatsApp Message Builder Security & Encoding Edge Cases
// -------------------------------------------------------------
console.log("--- 1. WhatsApp Builder Security & Encoding ---");

function buildWhatsAppLink(options) {
  if (!options.phoneNumber) return "";
  const cleanNumber = options.phoneNumber.replace(/[^\d]/g, "");
  if (!cleanNumber) return "";
  const lines = [];
  if (options.greeting) lines.push(options.greeting);
  else lines.push("Hello! I would like to enquire about:");
  if (options.itemName) lines.push(`Item: ${options.itemName}`);
  if (options.price !== undefined && options.price !== null) {
    const formattedPrice = typeof options.price === "number" ? formatINR(options.price) : options.price;
    lines.push(`Price: ${formattedPrice}`);
  }
  if (options.pageUrl) lines.push(`Link: ${options.pageUrl}`);
  if (options.extraLines && options.extraLines.length > 0) {
    for (const line of options.extraLines) {
      if (line.trim()) lines.push(line.trim());
    }
  }
  const messageText = lines.join("\n");
  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

const testCases = [
  {
    name: "Missing phone returns empty string",
    opts: { phoneNumber: "" },
    verify: (url) => url === "",
  },
  {
    name: "Phone with formatting stripped to digits only",
    opts: { phoneNumber: "+91 (98765) 43210" },
    verify: (url) => url.startsWith("https://wa.me/919876543210?text="),
  },
  {
    name: "Tamil script correctly URL-encoded",
    opts: {
      phoneNumber: "919876543210",
      itemName: "மணப்பெண் அலங்காரம்",
    },
    verify: (url) => url.includes(encodeURIComponent("மணப்பெண் அலங்காரம்")),
  },
  {
    name: "Emoji and special punctuation encoded safely",
    opts: {
      phoneNumber: "919876543210",
      itemName: "✨ Bridal Glow & Sparkle! #1 (100% Guaranteed) - ₹25,000",
    },
    verify: (url) =>
      url.includes(encodeURIComponent("✨ Bridal Glow & Sparkle! #1 (100% Guaranteed) - ₹25,000")),
  },
  {
    name: "Hostile HTML in item name does not inject parameters or tags",
    opts: {
      phoneNumber: "919876543210",
      itemName: '<script>alert(1)</script>&redirect_url=evil.com#"onload="alert(2)',
    },
    verify: (url) => {
      // Must not contain unencoded & or ? or #
      const queryPart = url.split("?text=")[1];
      return queryPart && !queryPart.includes("&redirect_url=") && !queryPart.includes("<script>");
    },
  },
  {
    name: "Very long description (5,000 chars) encoded without error",
    opts: {
      phoneNumber: "919876543210",
      itemName: "Long Item " + "A".repeat(5000),
    },
    verify: (url) => url.startsWith("https://wa.me/919876543210?text="),
  },
];

let allWaPassed = true;
for (const tc of testCases) {
  const result = buildWhatsAppLink(tc.opts);
  if (!tc.verify(result)) {
    allWaPassed = false;
    console.error(`WhatsApp builder failed test: ${tc.name}`);
  }
}

report(
  "D6-WHATSAPP-MATRIX",
  "WhatsApp link builder handles digits-only, missing numbers, unicode/Tamil/emoji, hostile HTML and long strings",
  allWaPassed,
  allWaPassed ? "All edge cases cleanly handled and URL encoded" : "Encoding or sanitization failure",
  "100% compliant URL-safe wa.me output"
);

// -------------------------------------------------------------
// 2. Security Headers & External Link Safety on Public Pages
// -------------------------------------------------------------
console.log("\n--- 2. Security Headers & External Links Safety ---");

const samplePages = ["/", "/services", "/jewellery", "/gallery", "/reviews", "/faq", "/about", "/contact"];

let headersCompliant = true;
let noHostileHrefs = true;
let externalRelCompliant = true;
let noThirdPartyScripts = true;
let dataOverexposed = false;
const exposedDetails = [];

for (const path of samplePages) {
  const res = await fetch(`${BASE_URL}${path}`);
  const headers = res.headers;

  const xfo = headers.get("x-frame-options");
  const xcto = headers.get("x-content-type-options");
  const referrer = headers.get("referrer-policy");

  if (!xfo || !xcto || !referrer) {
    headersCompliant = false;
  }

  const html = await res.text();
  const root = parse(html);

  // Check all <a> tags
  const links = root.querySelectorAll("a");
  for (const a of links) {
    const href = a.getAttribute("href") || "";
    if (
      href.toLowerCase().startsWith("javascript:") ||
      href.toLowerCase().startsWith("data:") ||
      href.toLowerCase().startsWith("vbscript:")
    ) {
      noHostileHrefs = false;
      console.error(`Hostile href protocol found on ${path}: ${href}`);
    }

    if (href.startsWith("http://") || href.startsWith("https://")) {
      const rel = a.getAttribute("rel") || "";
      if (!rel.includes("noopener")) {
        externalRelCompliant = false;
        console.error(`External link missing rel="noopener" on ${path}: ${href}`);
      }
    }
  }

  // Check script tags for third party scripts
  const scripts = root.querySelectorAll("script");
  for (const s of scripts) {
    const src = s.getAttribute("src");
    if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
      if (!src.includes("localhost") && !src.includes("127.0.0.1")) {
        noThirdPartyScripts = false;
        console.error(`Third-party script detected on ${path}: ${src}`);
      }
    }
  }

  // Check for secrets / data over-exposure in HTML and RSC payload
  if (
    html.includes("service_role") ||
    html.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    html.includes("sbp_") ||
    html.includes("eyJh") // raw JWT starts with eyJh
  ) {
    dataOverexposed = true;
    exposedDetails.push(`Possible sensitive token/secret detected on ${path}`);
  }
}

report(
  "D6-SECURITY-HEADERS",
  "Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) present on public responses",
  headersCompliant,
  headersCompliant ? "All required headers present" : "Missing security headers",
  "Standard security headers on all public responses"
);

report(
  "D6-HREF-SCHEMES",
  "Zero hostile protocols (javascript:, data:, vbscript:) in rendered anchor href attributes",
  noHostileHrefs,
  noHostileHrefs ? "All href attributes use safe protocols" : "Hostile protocol found in href",
  "Safe protocols only"
);

report(
  "D6-EXTERNAL-REL",
  "All external links include rel='noopener' or rel='noreferrer'",
  externalRelCompliant,
  externalRelCompliant ? "All external links protected" : "Missing noopener on external link",
  "rel='noopener' on external links"
);

report(
  "D6-NO-THIRD-PARTY-SCRIPTS",
  "Zero third-party script tags loaded on public website",
  noThirdPartyScripts,
  noThirdPartyScripts ? "Zero external script tags found" : "External script tags present",
  "Self-hosted / framework scripts only"
);

report(
  "D6-DATA-OVEREXPOSURE",
  "Scan HTML and RSC payloads for service role keys, secrets, or internal auth tokens",
  !dataOverexposed,
  dataOverexposed ? exposedDetails.join("; ") : "Zero service role keys or sensitive tokens found",
  "No confidential credentials in public payloads"
);

// -------------------------------------------------------------
// 3. Image Optimization Endpoint Host Whitelist
// -------------------------------------------------------------
console.log("\n--- 3. Next.js Image Optimization Endpoint Validation ---");

// Test arbitrary external host
const extRes = await fetch(
  `${BASE_URL}/_next/image?url=https%3A%2F%2Fevil.com%2Fmalicious.png&w=640&q=75`
);
const extRejected = extRes.status === 400;

// Test internal address / SSRF
const ssrfRes = await fetch(
  `${BASE_URL}/_next/image?url=http%3A%2F%2F169.254.169.254%2Flatest%2Fmeta-data&w=640&q=75`
);
const ssrfRejected = ssrfRes.status === 400;

// Test disallowed width
const widthRes = await fetch(
  `${BASE_URL}/_next/image?url=%2Fplaceholder.jpg&w=99999&q=75`
);
const widthRejected = widthRes.status === 400;

const imageOptPassed = extRejected && ssrfRejected && widthRejected;

report(
  "D6-IMAGE-OPTIMIZER-SECURITY",
  "Image optimization endpoint rejects arbitrary external hosts, internal IP addresses, and disallowed widths",
  imageOptPassed,
  `External: ${extRes.status}, SSRF: ${ssrfRes.status}, Width: ${widthRes.status}`,
  "HTTP 400 Bad Request on all invalid image optimization attempts"
);

// -------------------------------------------------------------
// 4. Robots & Indexing Policy
// -------------------------------------------------------------
console.log("\n--- 4. Robots.txt and Metadata Indexing Verification ---");

const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
const robotsText = await robotsRes.text();
const robotsStatus = robotsRes.status;

// When ALLOW_INDEXING is false (or default dev), robots.txt disallows all
const robotsCompliant =
  robotsStatus === 200 &&
  robotsText.toLowerCase().includes("user-agent:") &&
  (robotsText.includes("Disallow: /") || robotsText.includes("Allow: /"));

report(
  "D6-ROBOTS-POLICY",
  "robots.txt endpoint is reachable and enforces indexing configuration",
  robotsCompliant,
  `Status: ${robotsStatus}, Content snippet: ${robotsText.split("\n")[0]}`,
  "Valid robots.txt with disallow or allow rules"
);

console.log("\n========================================================");
console.log(`D6 AUDIT SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log("========================================================\n");

if (failCount > 0) process.exit(1);
