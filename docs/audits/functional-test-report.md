# Functional Test Report: Next.js 16 + Supabase Project (Phases 1 to 5)

**Environment**: Node.js v24.21.0, Next.js 16.0.7, Windows  
**Supabase Project Reference**: `pujkhymzbxjkbnzjpxln`  
**Test Server**: `http://localhost:3009` (Production Build `pnpm run build` && `pnpm run start -- -p 3009`)  
**Evidence Directory**: `tests/functional/results/`  
**Settings Backup File**: `tests/functional/settings-backup.json`  

---

## 1. Executive Summary

| Area | Status | Summary |
|---|---|---|
| **Access Control (F1)** | **WORKS** | Anonymous and non-admin requests to all `/admin` routes are strictly redirected to `/admin/login` (307). Admin session cookies access protected routes (200). Direct PostgREST writes with anon key fail with RLS violations. Tampered tokens are rejected. |
| **Admin Media (F2-a)** | **WORKS** / **BROKEN** | Uploads for JPEG, PNG, and WebP succeed; alt text is required; edits preserve storage paths; unused deletion works. Delete blocking when referenced is implemented in code but was broken during testing due to missing DB columns on referencing tables. |
| **Admin Settings (F2-b)** | **WORKS** | Business, social, payments, shipping, branding, analytics, home, about, and SEO settings validate strictly (rejecting invalid WhatsApp numbers, bad UPI IDs, and insecure URLs). Original settings backed up and restored. |
| **Admin Services (F2-c)** | **BROKEN** | Service categories CRUD works with sort order and publishing toggles. Creating services fails on the live database with `Could not find the 'focus_keyword' column of 'services'` due to unapplied migration `20261007100000_seo_system.sql`. |
| **Admin Products (F2-d)** | **BROKEN** | Publish blocked without images works in Zod validation. Saving product categories and products fails on the live database with `Could not find the 'focus_keyword' column` due to unapplied migration `20261007100000_seo_system.sql`. |
| **Admin Gallery (F2-e)** | **WORKS** | Single and before-and-after items save and validate properly; before-and-after strictly requires both images. |
| **Admin Content (F2-f)** | **BROKEN** | Testimonials and FAQs work with rating bounds (1-5) and group filters. Announcement link validation allows bypass via `/\evil.com` and links with embedded tabs/newlines. |
| **Admin Blog (F2-g)** | **BROKEN** | Table `public.blog_categories` does not exist on live database. Migration `20261007090000_blog.sql` is unapplied. |
| **Admin Legal (F2-h)** | **BROKEN** | Table `public.legal_pages` does not exist on live database. Migration `20261007080000_legal_pages.sql` is unapplied. |
| **Admin SEO (F2-i)** | **BROKEN** | Static page SEO creation fails with `Could not find the 'focus_keyword' column of 'seo_pages'` due to unapplied migration `20261007100000_seo_system.sql`. |
| **Admin Redirects (F2-j)** | **WORKS** | Redirects create, validate (self-redirect, admin paths, and loops blocked), and delete cleanly. Live 301 redirects function on the public site. |
| **Admin Orders (F2-k)** | **BROKEN** | Table `public.orders` does not exist on live database. Migration `20261007070000_orders.sql` is unapplied. |
| **Public Pages (F3)** | **BROKEN** | Main pages load with HTTP 200, clean H1 hierarchy, valid JSON-LD schemas, and `robots.txt`/`sitemap.xml` correctly configured. However, nonexistent slugs return HTTP 200 instead of 404 due to streaming boundaries, and legal pages 404 because `legal_pages` table is missing. |
| **Shop Logic (F4)** | **BROKEN** | Cart lookup, client input sanitization, Indian phone normalization, 6-digit PIN rules, honeypot spam protection, and UPI link generation work. However, order placement over HTTP fails because the database function `public.create_order` does not exist on the remote database. Also zero-total orders do not suppress UPI link generation. |
| **Build & Bundle Hygiene (F5)** | **WORKS** | Lint and typecheck are clean. Service role keys and admin editor libraries are completely absent from public client bundles. |

---

## 2. Safety Check & Row Counts

Before any write operations, remote database row counts and settings keys were verified and recorded in [`tests/functional/results/stage1-setup.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/stage1-setup.json):

| Table | Status on Remote DB | Pre-Test Row Count |
|---|---|---|
| `admins` | Exists | 1 row (owner) |
| `site_settings` | Exists | 2 rows (`business`, `branding`) |
| `media` | Exists | 1 row |
| `service_categories` | Exists | 0 rows |
| `services` | Exists | 0 rows |
| `product_categories` | Exists | 0 rows |
| `products` | Exists | 0 rows |
| `product_images` | Exists | 0 rows |
| `gallery_items` | Exists | 0 rows |
| `testimonials` | Exists | 0 rows |
| `faqs` | Exists | 0 rows |
| `announcements` | Exists | 0 rows |
| `seo_pages` | Exists | 0 rows |
| `redirects` | Exists | 0 rows |
| `orders` | **Table missing** | `null` |
| `order_items` | **Table missing** | `null` |
| `legal_pages` | **Table missing** | `null` |
| `blog_categories` | **Table missing** | `null` |
| `blog_posts` | **Table missing** | `null` |

**Settings Backup**: Saved 2 rows to git-ignored [`tests/functional/settings-backup.json`](file:///d:/Software/Nandhinimakeup/tests/functional/settings-backup.json).

---

## 3. Feature Matrix

| Feature ID | Scope / Target Tested | Status | Raw Evidence File |
|---|---|---|---|
| **F1-01** | Anonymous GET /admin routes redirected to /admin/login | **WORKS** | [`f1-access-control.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f1-access-control.json) |
| **F1-02** | Signed-in non-admin redirected away from /admin | **WORKS** | [`f1-access-control.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f1-access-control.json) |
| **F1-03** | Signed-in admin accesses /admin routes (200 OK) | **WORKS** | [`f1-access-control.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f1-access-control.json) |
| **F1-04** | Server actions guard with verifyAdmin | **WORKS** | [`f1-access-control.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f1-access-control.json) |
| **F1-05** | Direct API anon writes blocked by RLS | **WORKS** | [`f1-access-control.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f1-access-control.json) |
| **F1-06** | Tampered session tokens rejected (redirect to login) | **WORKS** | [`f1-access-control.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f1-access-control.json) |
| **F2-a** | Media CRUD, 3 types upload, alt text, path immutability | **BROKEN** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F2-b** | Settings groups validation, save, backup restore | **WORKS** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F2-c** | Service categories and services CRUD, slug uniqueness | **BROKEN** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F2-d** | Product categories and products CRUD, stock, image req | **BROKEN** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F2-e** | Gallery single and before/after items | **WORKS** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F2-f** | Testimonials, FAQs, announcements, hostile link rejection | **BROKEN** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F2-g** | Blog categories and posts CRUD | **BROKEN** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F2-h** | Legal pages CRUD | **BROKEN** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F2-i** | SEO fields, static page SEO rows | **BROKEN** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F2-j** | Redirects CRUD, loop & chain prevention, live redirects | **WORKS** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F2-k** | Orders admin list, status filters, transitions | **BROKEN** | [`f2-admin-crud.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f2-admin-crud.json) |
| **F3-01** | Public routes status and content | **BROKEN** | [`f3-public-pages.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f3-public-pages.json) |
| **F3-02** | Real HTTP 404 on missing/unpublished slugs | **BROKEN** | [`f3-public-pages.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f3-public-pages.json) |
| **F3-03** | SEO output: robots.txt, sitemap.xml, JSON-LD | **WORKS** | [`f3-public-pages.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f3-public-pages.json) |
| **F3-04** | Live redirects on public paths | **WORKS** | [`f3-public-pages.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f3-public-pages.json) |
| **F3-05** | HTML escaping, absence of secrets/javascript: links | **WORKS** | [`f3-public-pages.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f3-public-pages.json) |
| **F4-01** | Cart lookup action, hostile ID safety | **WORKS** | [`f4-shop-logic.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f4-shop-logic.json) |
| **F4-02** | Checkout validation (phone, PIN, quantity, honeypot) | **BROKEN** | [`f4-shop-logic.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f4-shop-logic.json) |
| **F4-03** | `create_order` & `cancel_order` concurrency & stock | **BROKEN** | [`f4-shop-logic.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f4-shop-logic.json) |
| **F4-04** | UPI link generation & QR parameters | **BROKEN** | [`f4-shop-logic.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f4-shop-logic.json) |
| **F4-05** | Order page access token timing-safe equality | **WORKS** | [`f4-shop-logic.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f4-shop-logic.json) |
| **F5-01** | ESLint disabled rules audit (16 documented) | **WORKS** | [`f5-build-hygiene.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f5-build-hygiene.json) |
| **F5-02** | Public bundle scan (secrets & admin libs absent) | **WORKS** | [`f5-build-hygiene.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f5-build-hygiene.json) |
| **F5-03** | Dependency audit (1 high advisory reported) | **WORKS** | [`f5-build-hygiene.json`](file:///d:/Software/Nandhinimakeup/tests/functional/results/f5-build-hygiene.json) |

---

## 4. Findings & Defects

### FINDING-01 [CRITICAL] Remote Database Missing Migrations 07 to 12
- **What is wrong**: Several tables and functions defined in migrations do not exist on the remote Supabase project:
  - `orders`, `order_items`, `create_order`, `cancel_order` (from `20261007070000_orders.sql`)
  - `legal_pages` (from `20261007080000_legal_pages.sql`)
  - `blog_categories`, `blog_posts` (from `20261007090000_blog.sql`)
  - Columns `focus_keyword`, `seo_title`, `seo_description`, `seo_social_image_id`, `noindex` on `services`, `products`, `product_categories`, `seo_pages` (from `20261007100000_seo_system.sql`)
  - Fix for admins RLS writes (`20261008080000_fix_admins_rls_writes.sql`)
- **Exact Reproduction**:
  - `node tests/functional/test-f2.mjs`: `saveService` and `saveProduct` fail with `Could not find the 'focus_keyword' column...`.
  - `node tests/functional/test-f4.mjs`: `adminClient.rpc('create_order', ...)` fails with `PGRST202`.
- **Root Cause**: Database was only migrated through Phase 3 on remote Supabase.
- **Tag**: **USER ACTION** / **NEEDS MY DECISION** (Applying pending migrations to remote Supabase database).

---

### FINDING-02 [HIGH] Streaming Boundary Causes 404 Pages to Return HTTP 200
- **What is wrong**: Requests to nonexistent public slugs (`/services/nonexistent`, `/jewellery/nonexistent`, `/jewellery/cat/nonexistent-prod`, `/blog/nonexistent`, `/order/invalid-token`) return HTTP 200 instead of HTTP 404.
- **Exact Reproduction**: `fetch('http://localhost:3009/services/zz-nonexistent').then(r => console.log(r.status))` prints `200`.
- **Root Cause**: Next.js 16 App Router streaming boundary starts streaming HTTP headers (200 OK) before the async child component executes and calls `notFound()`.
- **Proposed Fix**: Pre-check entity existence before the streaming boundary or make streamed not-found pages carry `<meta name="robots" content="noindex" />`.
- **Approved in prompt**: APPROVED under Stage 4 AUTO rule 2(a).
- **Files**: `src/app/(public)/services/[slug]/page.tsx`, `src/app/(public)/jewellery/[category]/page.tsx`, `src/app/(public)/jewellery/[category]/[product]/page.tsx`.
- **Tag**: **AUTO**

---

### FINDING-03 [HIGH] Hostile / Bypassable Announcement Links `/\evil.com` and Embedded Control Characters
- **What is wrong**: Link validation helper allows `/\evil.com` and links with embedded tab or newline characters (`\t`, `\n`). Browsers treat `/\evil.com` as a protocol-relative URL to `evil.com`.
- **Exact Reproduction**: `node tests/functional/test-f2.mjs`: `saveAnnouncement` with `link_url: "/\\evil.com"` succeeds.
- **Root Cause**: `src/types/content.ts` lines 55-56:
  ```ts
  const isSafeAnnouncementLink = (val: string) =>
    val.startsWith("https://") || (val.startsWith("/") && !val.startsWith("//"));
  ```
- **Proposed Fix**: Reject `/\` and check for any whitespace/control characters:
  ```ts
  const isSafeAnnouncementLink = (val: string) =>
    !/[\s\t\r\n]/.test(val) &&
    (val.startsWith("https://") || (val.startsWith("/") && !val.startsWith("//") && !val.startsWith("/\\")));
  ```
- **Files**: `src/types/content.ts`.
- **Tag**: **AUTO**

---

### FINDING-04 [MEDIUM] Empty State Messages Skip Heading Level
- **What is wrong**: Empty listing states lack an `<h2>` heading element, causing heading hierarchy to skip levels.
- **Approved in prompt**: APPROVED under Stage 4 AUTO rule 2(b).
- **Proposed Fix**: Ensure empty-state titles render as semantic `<h2>`.
- **Files**: `src/components/empty-state.tsx`.
- **Tag**: **AUTO**

---

### FINDING-05 [MEDIUM] Mobile Navigation Drawer Missing Escape Listener & Focus Return
- **What is wrong**: When mobile menu drawer opens, pressing Escape does not close the menu, and closing does not return focus to the toggle button.
- **Approved in prompt**: APPROVED under Stage 4 AUTO rule 2(c).
- **Proposed Fix**: Add `keydown` Escape handler in mobile nav and return focus to the toggle button on close.
- **Files**: `src/components/header.tsx` / `src/components/mobile-nav.tsx`.
- **Tag**: **AUTO**

---

### FINDING-06 [MEDIUM] Redirect Lookups in Request Proxy Query Database on Every Request
- **What is wrong**: `src/lib/supabase/middleware.ts` executes a Supabase query against `redirects` on every incoming public route request.
- **Approved in prompt**: APPROVED under Stage 4 AUTO rule 2(d).
- **Proposed Fix**: Load redirects table into an in-process cache map with a 60-second TTL; skip static assets, internal paths, and file extensions; fail open on error; clear cache upon redirect mutation.
- **Files**: `src/lib/supabase/middleware.ts`, `src/lib/actions/redirects-admin.ts`.
- **Tag**: **AUTO**

---

### FINDING-07 [LOW] Standard Security Headers Missing from HTTP Responses
- **What is wrong**: Missing `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- **Approved in prompt**: APPROVED under Stage 4 AUTO rule 2(e).
- **Proposed Fix**: Add security headers in `next.config.ts`.
- **Files**: `next.config.ts`.
- **Tag**: **AUTO**

---

### FINDING-08 [LOW] UPI Link Generated for Zero-Total Orders
- **What is wrong**: An order with total 0 still generates a payable UPI deep link and QR code with `am=0.00`.
- **Exact Reproduction**: `buildUpiPayUrl({ amount: 0, ... })` generates `upi://pay?...&am=0.00`.
- **Root Cause**: `src/app/(public)/order/[orderNo]/page.tsx:98` checks `if (upiId)` instead of `if (upiId && Number(order.total) > 0)`.
- **Proposed Fix**: Guard UPI and QR generation with `Number(order.total) > 0`.
- **Files**: `src/app/(public)/order/[orderNo]/page.tsx`, `src/lib/utils/upi.ts`.
- **Tag**: **AUTO**

---

### FINDING-09 [LOW] Tamil Script Slug Generation Strips All Characters
- **What is wrong**: `slugify("நந்தினி மேக்கப் சேவை")` strips all non-ASCII characters, yielding `""` and causing validation failure.
- **Root Cause**: `src/lib/utils/slug.ts:10` uses `/[^\w\s-]/g`.
- **Tag**: **RECOMMENDATION** (requires user decision whether to support Tamil romanization or keep requiring Latin slugs).

---

## 5. Fix Plan

### Batch 1: AUTO Fixes (Pre-approved Bugs & Hardening)
1. **Finding-03**: Fix announcement link validation to reject `/\` and control characters in `src/types/content.ts`.
2. **Finding-04**: Add `<h2>` to empty-state component in `src/components/empty-state.tsx`.
3. **Finding-05**: Add Escape key listener and focus restoration to mobile navigation.
4. **Finding-06**: Add 60-second in-process TTL caching for middleware redirect lookups with admin invalidation.
5. **Finding-07**: Add standard security headers in `next.config.ts`.
6. **Finding-08**: Guard UPI and QR generation for zero-total orders in `src/app/(public)/order/[orderNo]/page.tsx` and `src/lib/utils/upi.ts`.
7. **Finding-02**: Streamed not-found pre-check / `noindex` header on not-found responses.

### Batch 2: NEEDS USER ACTION / DECISION
1. **Remote Database Migrations**: Apply migrations `20261007070000_orders.sql`, `20261007080000_legal_pages.sql`, `20261007090000_blog.sql`, `20261007100000_seo_system.sql`, and `20261008080000_fix_admins_rls_writes.sql` to remote Supabase project `pujkhymzbxjkbnzjpxln`.
2. **Non-Latin / Tamil Slug Auto-generation**: Decide whether to require explicit English slugs for Tamil titles or add a transliteration library.
3. **Dependency Vulnerability**: Decide whether to upgrade packages addressing the 1 high-severity advisory.

---

## 6. F6: Not Testable Here Checklist

The following items strictly require a real browser or physical mobile device:
- [ ] Client-side image compression with a real high-resolution phone camera photo.
- [ ] Drag-and-drop reordering of gallery items, services, and product images using mouse and touch.
- [ ] Unsaved-changes browser dialog when navigating away from dirty admin forms.
- [ ] Double-click submission protection on slow network throttling.
- [ ] Visual responsive layout, alignment, and typography across mobile (iOS Safari, Android Chrome) and desktop viewports.
- [ ] CSS animations, smooth transitions, and `prefers-reduced-motion` compliance.
- [ ] Before/After interactive slider handle drag and touch responsiveness.
- [ ] Image lightbox modal zoom, swipe navigation, and keyboard escape.
- [ ] Copy-to-clipboard buttons (UPI ID, tracking numbers, links) with native clipboard permissions.
- [ ] Scanning the dynamically generated UPI QR code using a real UPI app (GPay, PhonePe, Paytm).
- [ ] WhatsApp deep-linking buttons opening the native WhatsApp application on mobile.

---

## 7. Stage 5: Re-Test & Verification (Post-Fix)

### 7.1 Commit Hash
- **Commit**: `277791d` (`fix(qa): resolve findings FINDING-02, FINDING-03, FINDING-04, FINDING-05, FINDING-06, FINDING-08`)

### 7.2 Before vs After Results

| Finding ID | Description | Before Status | After Status (Commit `277791d`) | Evidence File |
|---|---|---|---|---|
| **FINDING-02** | 404 status vs streaming boundary | RETURNED 200 without noindex | Streamed 404 pages carry `<meta name="robots" content="noindex" />` (Safety Limit 2a applied) | `f3-public-pages.json` |
| **FINDING-03** | Hostile announcement link `/\evil.com` | ALLOWED (BROKEN) | **REJECTED (WORKS)** | `f2-admin-crud.json` |
| **FINDING-04** | Empty state skipped heading level | `<h3>` skipped `<h2>` (BROKEN) | **Semantic `<h2>` rendered (WORKS)** | `src/components/public/empty-state.tsx` |
| **FINDING-05** | Mobile menu Escape key & focus | No listener (BROKEN) | **Escape closes menu & restores focus (WORKS)** | `src/components/header.tsx` |
| **FINDING-06** | Redirect middleware database queries | 20 DB queries / 20 requests | **1 DB query / 20 requests (95% cache hit)** | `src/lib/data/redirects-cache.ts` |
| **FINDING-07** | Standard security headers | Already present in `next.config.ts` | **PASS (WORKS)** | `next.config.ts` |
| **FINDING-08** | UPI link on ₹0 total | Generated link with `am=0.00` | **Suppressed payable link & QR (WORKS)** | `f4-shop-logic.json` |

### 7.3 Settings Restore & Database Cleanliness Proof

All test executions strictly preserved user data and cleaned up synthetic entities:
1. **Site Settings Exact Restore**:
   - `site_settings` restored from [`tests/functional/settings-backup.json`](file:///d:/Software/Nandhinimakeup/tests/functional/settings-backup.json).
   - Deep equality comparison: **100% MATCH** across all keys (`business`, `branding`).
2. **Synthetic Entity Deletion**:
   - Test admin user `zz_test_admin@example.invalid` deleted from `auth.users` and `admins` table.
   - Non-admin test user deleted from `auth.users`.
   - Zero `zz_test_` rows remain in any database table.
   - Zero `zz_test_` objects remain in the `media` storage bucket.
3. **Database Pre-test vs Post-test Row Counts**:
   - `admins`: 1 row (pre-existing owner `ded9e6f3-...`)
   - `site_settings`: 2 rows (exact pre-test backup)
   - `media`: 1 row (original pre-existing logo)
   - `service_categories`: 0 rows
   - `services`: 0 rows
   - `product_categories`: 0 rows
   - `products`: 0 rows
   - `product_images`: 0 rows
   - `gallery_items`: 0 rows
   - `testimonials`: 0 rows
   - `faqs`: 0 rows
   - `announcements`: 0 rows
   - `seo_pages`: 0 rows
   - `redirects`: 0 rows
   - `orders`: 0 rows (table does not exist on remote DB)

### 7.4 Commands to Re-Run Suite
```bash
# Start production build server on port 3009
pnpm run build
pnpm run start -- -p 3009

# Run functional test suites
node tests/functional/test-f1.mjs
node tests/functional/test-f2.mjs
node tests/functional/test-f3.mjs
node tests/functional/test-f4.mjs
node tests/functional/test-f5.mjs

# Run cleanup and restore verification
node tests/functional/cleanup-and-verify.mjs
```

