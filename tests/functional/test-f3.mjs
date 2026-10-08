import fs from "node:fs";
import {
  BASE_URL,
  adminClient,
  saveResult,
} from "./common.mjs";

console.log("=== RUNNING F3: PUBLIC PAGES AUDIT ===");

const f3Results = {};

async function runF3() {
  // 1. Status and content check for all public routes
  console.log("\n--- F3-01: Public Routes Status & Content ---");
  const publicRoutes = [
    { route: "/", name: "home", expectedStatus: 200 },
    { route: "/services", name: "services", expectedStatus: 200 },
    { route: "/jewellery", name: "jewellery", expectedStatus: 200 },
    { route: "/gallery", name: "gallery", expectedStatus: 200 },
    { route: "/reviews", name: "reviews", expectedStatus: 200 },
    { route: "/faq", name: "faq", expectedStatus: 200 },
    { route: "/about", name: "about", expectedStatus: 200 },
    { route: "/contact", name: "contact", expectedStatus: 200 },
    { route: "/blog", name: "blog", expectedStatus: 200 },
    { route: "/cart", name: "cart", expectedStatus: 200 },
    { route: "/checkout", name: "checkout", expectedStatus: 200 },
    { route: "/shipping-and-returns", name: "legal_shipping", expectedStatus: 200 },
    { route: "/terms-and-conditions", name: "legal_terms", expectedStatus: 200 },
    { route: "/privacy-policy", name: "legal_privacy", expectedStatus: 200 },
    { route: "/robots.txt", name: "robots", expectedStatus: 200 },
    { route: "/sitemap.xml", name: "sitemap", expectedStatus: 200 },
  ];

  const routeResults = [];
  for (const item of publicRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${item.route}`);
      const text = await res.text();
      const statusOk = res.status === item.expectedStatus;
      
      // Check h1 count
      const h1Matches = text.match(/<h1[^>]*>/gi) || [];
      const h1Count = h1Matches.length;

      // Check title tag
      const titleMatch = text.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : null;

      // Check sensitive data leak (service role key prefix)
      const leakedKey = text.includes("UoQ9oBygJiEmUDl12Qx4oybKdWlBVE-ngHJn0JEVdWE") || text.includes("SUPABASE_SERVICE_ROLE_KEY");

      routeResults.push({
        route: item.route,
        status: res.status,
        expectedStatus: item.expectedStatus,
        pass: statusOk,
        h1Count,
        title,
        leakedKey,
      });
      console.log(`  Route ${item.route.padEnd(25)} -> ${res.status} | H1s: ${h1Count} | Title: "${title?.slice(0, 30) || 'None'}"`);
    } catch (e) {
      routeResults.push({
        route: item.route,
        pass: false,
        error: e.message,
      });
      console.log(`  Route ${item.route.padEnd(25)} -> ERROR: ${e.message}`);
    }
  }

  f3Results.f3_01_public_routes = {
    status: routeResults.every((r) => r.pass) ? "WORKS" : "BROKEN",
    routes: routeResults,
  };

  // 2. Not Found Routes: Missing and Unpublished Slugs
  console.log("\n--- F3-02: 404 Status for Missing / Unpublished Slugs ---");
  const missingRoutes = [
    { route: "/services/zz-nonexistent-service", desc: "Nonexistent service" },
    { route: "/jewellery/zz-nonexistent-cat", desc: "Nonexistent jewellery category" },
    { route: "/jewellery/zz-cat/zz-nonexistent-prod", desc: "Nonexistent product" },
    { route: "/blog/zz-nonexistent-post", desc: "Nonexistent blog post" },
    { route: "/order/TST-999999", desc: "Nonexistent order token" },
  ];

  const notFoundResults = [];
  for (const item of missingRoutes) {
    const res = await fetch(`${BASE_URL}${item.route}`);
    // Check if returns real 404 HTTP status
    const is404 = res.status === 404;
    notFoundResults.push({
      route: item.route,
      desc: item.desc,
      status: res.status,
      pass: is404,
    });
    console.log(`  ${item.desc.padEnd(32)} -> status ${res.status} (${is404 ? "PASS 404" : "RETURNED " + res.status})`);
  }

  f3Results.f3_02_not_found_handling = {
    status: notFoundResults.every((r) => r.pass) ? "WORKS" : "BROKEN",
    checks: notFoundResults,
  };

  // 3. SEO Output: robots.txt and sitemap.xml
  console.log("\n--- F3-03: SEO Output & robots.txt / sitemap.xml ---");
  const seoChecks = {};

  // Check robots.txt (with ALLOW_INDEXING=false)
  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  const robotsText = await robotsRes.text();
  const robotsDisallowsAll = robotsText.includes("Disallow: /");
  seoChecks.robotsTxt = {
    status: robotsRes.status,
    disallowsAll: robotsDisallowsAll,
    content: robotsText.trim(),
    pass: robotsRes.status === 200 && robotsDisallowsAll,
  };
  console.log(`  robots.txt disallows indexing when ALLOW_INDEXING=false: ${robotsDisallowsAll ? "PASS" : "FAIL"}`);

  // Check sitemap.xml
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapText = await sitemapRes.text();
  const sitemapValidXml = sitemapText.includes("<?xml") || sitemapText.includes("<urlset");
  const excludesAdmin = !sitemapText.includes("/admin");
  const excludesCart = !sitemapText.includes("/cart") && !sitemapText.includes("/checkout");
  seoChecks.sitemapXml = {
    status: sitemapRes.status,
    validXml: sitemapValidXml,
    excludesAdmin,
    excludesCart,
    pass: sitemapRes.status === 200 && sitemapValidXml && excludesAdmin && excludesCart,
  };
  console.log(`  sitemap.xml valid and excludes admin/cart/checkout: ${seoChecks.sitemapXml.pass ? "PASS" : "FAIL"}`);

  // Structured Data (JSON-LD) on Homepage
  const homeRes = await fetch(`${BASE_URL}/`);
  const homeHtml = await homeRes.text();
  const jsonLdMatches = homeHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  const validJsonLdBlocks = [];
  for (const block of jsonLdMatches) {
    const jsonStr = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
    try {
      const parsed = JSON.parse(jsonStr);
      validJsonLdBlocks.push(parsed);
    } catch (e) {
      validJsonLdBlocks.push({ parseError: e.message });
    }
  }
  seoChecks.structuredData = {
    blocksFound: jsonLdMatches.length,
    validBlocks: validJsonLdBlocks.length,
    blocks: validJsonLdBlocks,
    pass: jsonLdMatches.length > 0 && validJsonLdBlocks.every((b) => !b.parseError),
  };
  console.log(`  JSON-LD structured data on home: ${validJsonLdBlocks.length} valid blocks found (${seoChecks.structuredData.pass ? "PASS" : "FAIL"})`);

  f3Results.f3_03_seo_output = {
    status: seoChecks.robotsTxt.pass && seoChecks.sitemapXml.pass && seoChecks.structuredData.pass ? "WORKS" : "BROKEN",
    checks: seoChecks,
  };

  // 4. Live Redirects Testing
  // Test redirect created via admin server action (which clears in-process cache)
  const identities = JSON.parse(fs.readFileSync("tests/functional/identities.json", "utf8"));
  const saveRedRes = await fetch(`${BASE_URL}/admin`, {
    method: "POST",
    headers: {
      "Next-Action": "40590ac70eeac3a4addff5da5d8b660317e1ab203d",
      "Cookie": identities.admin.cookieHeader,
      "Content-Type": "text/plain;charset=UTF-8",
      "Accept": "text/x-component",
    },
    body: JSON.stringify([{ from_path: "/zz-test-redirect-live", to_path: "/services", status_code: 301 }]),
  });
  const saveText = await saveRedRes.text();
  const saveMatch = saveText.split("\n").find((l) => l.startsWith("1:"));
  const savedRed = saveMatch ? JSON.parse(saveMatch.slice(2)) : null;
  const testRedId = savedRed?.data?.id;

  const redirectLiveRes = await fetch(`${BASE_URL}/zz-test-redirect-live`, { redirect: "manual" });
  const redLocation = redirectLiveRes.headers.get("location");
  const redPass = redirectLiveRes.status === 301 && redLocation && redLocation.includes("/services");
  console.log(`  Live redirect /zz-test-redirect-live -> status ${redirectLiveRes.status}, location: ${redLocation} (${redPass ? "PASS" : "FAIL"})`);

  if (testRedId) {
    await fetch(`${BASE_URL}/admin`, {
      method: "POST",
      headers: {
        "Next-Action": "401c95092ac47112c4331fca4883acc70fbef33166",
        "Cookie": identities.admin.cookieHeader,
        "Content-Type": "text/plain;charset=UTF-8",
        "Accept": "text/x-component",
      },
      body: JSON.stringify([testRedId]),
    });
  }

  f3Results.f3_04_live_redirects = {
    status: redPass ? "WORKS" : "BROKEN",
    tested: {
      status: redirectLiveRes.status,
      location: redLocation,
      pass: redPass,
    },
  };

  // 5. Escaping and Sensitive Field Leak Scanning
  console.log("\n--- F3-05: Escaping & Sensitive Data Scanning ---");
  const scanPages = ["/", "/services", "/jewellery", "/gallery", "/about", "/contact"];
  let leakDetected = false;
  let javascriptLinkDetected = false;

  for (const p of scanPages) {
    const res = await fetch(`${BASE_URL}${p}`);
    const html = await res.text();
    if (html.includes("javascript:") || html.includes("data:text/html")) {
      javascriptLinkDetected = true;
    }
    if (html.includes("SUPABASE_SERVICE_ROLE_KEY") || html.includes("UoQ9oBygJiEmUDl12Qx4oybKdWlBVE-ngHJn0JEVdWE")) {
      leakDetected = true;
    }
  }

  f3Results.f3_05_escaping_and_security = {
    status: !leakDetected && !javascriptLinkDetected ? "WORKS" : "BROKEN",
    leakDetected,
    javascriptLinkDetected,
  };
  console.log(`  Sensitive key leaks: ${leakDetected ? "LEAKED" : "NONE DETECTED (PASS)"}`);
  console.log(`  Dangerous javascript: links: ${javascriptLinkDetected ? "DETECTED" : "NONE DETECTED (PASS)"}`);

  saveResult("f3-public-pages.json", f3Results);
  console.log("\nF3 tests completed! Evidence written to tests/functional/results/f3-public-pages.json\n");
}

runF3().catch((err) => {
  console.error("F3 run failed:", err);
  process.exit(1);
});
