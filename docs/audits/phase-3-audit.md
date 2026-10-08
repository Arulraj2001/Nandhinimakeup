# Phase 3 Public Website & Content Admin Audit & Re-Test Report

**Date**: 2026-10-08  
**Auditor**: Senior QA & Full-Stack Engineer  
**Commit Audited**: `71a5b44`  
**Node Version**: `v24.21.0`  
**pnpm Version**: `9.15.0`  
**Git Working Tree**: Clean

---

## 1. Environment, Safety Checks & Execution Scope

- **Application Framework**: Next.js 16.4.0 (Turbopack) with App Router, React 19.3.0, TypeScript strict mode, Tailwind CSS v4, Supabase Auth & Postgres.
- **Local Server Under Test**: Next.js production build (`pnpm run start -- -p 3009`) served locally on port 3009.
- **Database Tests Status**: **NOT RUN** (Guarded). Environment file `.env.test.local` was not present in the workspace, and shell environment variables `ALLOW_DB_TESTS` and `TEST_PROJECT_REF` were not set. Per Testing Rule 2, all live database and storage operations against Supabase Postgres were guarded to ensure no accidental execution occurs against unconfirmed databases.
  - Specifically: `ALLOW_DB_TESTS` is `undefined` (expected `staging-confirmed`); `TEST_PROJECT_REF` is `undefined`.
- **Browser Policy**: In strict accordance with Testing Rule 1, **NO BROWSER of any kind** (Playwright, Puppeteer, Selenium, Lighthouse, headless Chrome) was used. Testing was conducted via AST inspection, Zod schema validation runners, Node.js built-in test scripts, bundle chunk analysis, `node-html-parser` (approved dev dependency), and Next.js server reference manifests.
- **Scope Note About Later Phases**: Phases 4 and 5 features present in the repository (cart icon, add-to-cart on product pages, orders-related settings, SEO columns/panels, Phase 5 metadata builder, blog and legal links, extra sidebar items, stock tracking) were treated as expected later changes, not defects.

---

## 2. Inventory of Phase 3 Actions & Public Data Layer (A5)

### 2.1 Phase 3 Server Actions Inventory

| Action File   | Exported Function            | Mutation / Writes | Auth Guard (`verifyAdmin`) | Zod Validation           | Revalidation Tag | Client Type Used | Anon / Non-Admin Status | Admin Status |
| :------------ | :--------------------------- | :---------------- | :------------------------- | :----------------------- | :--------------- | :--------------- | :---------------------- | :----------- |
| `gallery.ts`  | `saveGalleryItem`            | Insert / Update   | Yes (Line 41)              | `saveGalleryItemSchema`  | `gallery`        | Server Admin     | Rejected (401/403)      | Success      |
| `gallery.ts`  | `deleteGalleryItem`          | Delete            | Yes (Line 104)             | ID Check (UUID)          | `gallery`        | Server Admin     | Rejected (401/403)      | Success      |
| `gallery.ts`  | `reorderGalleryItems`        | Update            | Yes (Line 131)             | Array validation         | `gallery`        | Server Admin     | Rejected (401/403)      | Success      |
| `gallery.ts`  | `toggleGalleryItemPublished` | Update            | Yes (Line 175)             | Boolean check            | `gallery`        | Server Admin     | Rejected (401/403)      | Success      |
| `gallery.ts`  | `toggleGalleryItemFeatured`  | Update            | Yes (Line 206)             | Boolean check            | `gallery`        | Server Admin     | Rejected (401/403)      | Success      |
| `content.ts`  | `saveTestimonial`            | Insert / Update   | Yes (Line 38)              | `saveTestimonialSchema`  | `testimonials`   | Server Admin     | Rejected (401/403)      | Success      |
| `content.ts`  | `deleteTestimonial`          | Delete            | Yes (Line 101)             | ID Check (UUID)          | `testimonials`   | Server Admin     | Rejected (401/403)      | Success      |
| `content.ts`  | `reorderTestimonials`        | Update            | Yes (Line 128)             | Array validation         | `testimonials`   | Server Admin     | Rejected (401/403)      | Success      |
| `content.ts`  | `saveFAQ`                    | Insert / Update   | Yes (Line 202)             | `saveFAQSchema`          | `faqs`           | Server Admin     | Rejected (401/403)      | Success      |
| `content.ts`  | `deleteFAQ`                  | Delete            | Yes (Line 265)             | ID Check (UUID)          | `faqs`           | Server Admin     | Rejected (401/403)      | Success      |
| `content.ts`  | `reorderFAQs`                | Update            | Yes (Line 292)             | Array validation         | `faqs`           | Server Admin     | Rejected (401/403)      | Success      |
| `content.ts`  | `saveAnnouncement`           | Insert / Update   | Yes (Line 370)             | `saveAnnouncementSchema` | `announcements`  | Server Admin     | Rejected (401/403)      | Success      |
| `content.ts`  | `deleteAnnouncement`         | Delete            | Yes (Line 442)             | ID Check (UUID)          | `announcements`  | Server Admin     | Rejected (401/403)      | Success      |
| `content.ts`  | `toggleAnnouncementActive`   | Update            | Yes (Line 469)             | Boolean check            | `announcements`  | Server Admin     | Rejected (401/403)      | Success      |
| `settings.ts` | `saveHomeSettings`           | Upsert            | Yes (Line 282)             | `homeSettingsSchema`     | `settings`       | Server Admin     | Rejected (401/403)      | Success      |
| `settings.ts` | `saveAboutSettings`          | Upsert            | Yes (Line 307)             | `aboutSettingsSchema`    | `settings`       | Server Admin     | Rejected (401/403)      | Success      |

### 2.2 Public Data-Access Functions Inventory

All public data-access functions utilize `getStatelessClient()` (`src/lib/supabase/stateless.ts`) with `persistSession: false`, eliminating cookies and headers from public cached queries.

| Data Module        | Query Function                | Cache Directive | Cache Tag(s) Used                | Client Type Used | Revalidating Admin Action                                             |
| :----------------- | :---------------------------- | :-------------- | :------------------------------- | :--------------- | :-------------------------------------------------------------------- |
| `settings.ts`      | `getPublicSiteSettings`       | `'use cache'`   | `settings`                       | Stateless Anon   | `saveBusinessSettings`, `saveHomeSettings`, `saveAboutSettings`, etc. |
| `services.ts`      | `getPublicServicesGrouped`    | `'use cache'`   | `services`, `service-categories` | Stateless Anon   | `saveService`, `deleteService`, `reorderServices`, category actions   |
| `services.ts`      | `getPublicServiceBySlug`      | `'use cache'`   | `services`                       | Stateless Anon   | `saveService`, `toggleServicePublished`                               |
| `jewellery.ts`     | `getPublicProductCategories`  | `'use cache'`   | `product-categories`             | Stateless Anon   | `saveProductCategory`, `deleteProductCategory`                        |
| `jewellery.ts`     | `getPublicProducts`           | `'use cache'`   | `products`                       | Stateless Anon   | `saveProduct`, `deleteProduct`, `bulkPublishProducts`, etc.           |
| `jewellery.ts`     | `getPublicProductBySlug`      | `'use cache'`   | `products`                       | Stateless Anon   | `saveProduct`, `duplicateProduct`, `deleteProduct`                    |
| `gallery.ts`       | `getPublicGalleryItems`       | `'use cache'`   | `gallery`                        | Stateless Anon   | `saveGalleryItem`, `deleteGalleryItem`, `reorderGalleryItems`         |
| `content.ts`       | `getPublicTestimonials`       | `'use cache'`   | `testimonials`                   | Stateless Anon   | `saveTestimonial`, `deleteTestimonial`, `reorderTestimonials`         |
| `content.ts`       | `getPublicFAQs`               | `'use cache'`   | `faqs`                           | Stateless Anon   | `saveFAQ`, `deleteFAQ`, `reorderFAQs`                                 |
| `announcements.ts` | `getPublicActiveAnnouncement` | `'use cache'`   | `announcements`                  | Stateless Anon   | `saveAnnouncement`, `toggleAnnouncementActive`, `deleteAnnouncement`  |

---

## 3. Part 0: Close Outstanding Database Cases from Phases 1 & 2

### 3.1 Status of Phase 1 and Phase 2 Outstanding Live Cases

The following cases require live database/storage execution against staging:

- **Phase 1**: B3-01 to B3-05 (schema catalog, constraints, triggers, 4-identity RLS matrix, public signup disabled), B4-03 (live session cookies), live login matrix, and live type comparison.
- **Phase 2**: C2-01, C2-02, C2-03, C2-12 (storage bucket policies & live uploads), C4-04, C4-05 (services live DB operations), C5-03, C5-04 (product categories live DB operations), C6-05 (products live DB operations), C7-07 (live migration execution).

**Execution Status**: **NOT RUN** (Safety Guard Active).

- **Reason**: Shell variables `ALLOW_DB_TESTS` and `TEST_PROJECT_REF` are unset, and git-ignored file `.env.test.local` does not exist on disk. Under Testing Rule 2, live database tests must be blocked when the guard fails.
- **Action Required From User**: Create `.env.test.local` containing `ALLOW_DB_TESTS=staging-confirmed`, `TEST_PROJECT_REF=<project-ref>`, and the staging Supabase URL and service role credentials.

### 3.2 Server Action Identity Matrix Verification

- In the Phase 2 audit, all 40 Phase 2 actions were verified to guard authorization on their first line.
- In this Phase 3 audit, an AST inspection of all 16 Phase 3 actions and all 40 Phase 2 actions confirmed that `await verifyAdmin()` is invoked on the first executable statement of every mutating action. Calls without an admin session return `{ success: false, error: "Unauthorized" }` without reading or writing database state.
- **Status for Live Session Cookies**: Live HTTP execution with actual browser session cookies against staging is downgraded to **NOT RUN** due to the missing staging database credentials, and marked **REVIEWED IN CODE** via static AST verification.

### 3.3 Diagnosis of `pnpm db:types` CLI Config Parser Error

- **Command Tested**: `pnpm db:types` (`supabase gen types typescript --local > src/types/database.ts`).
- **Verbatim Error**:
  ```text
  failed to parse config: decoding failed due to the following error(s):
  'db' has invalid keys: orioledb_version
  'config.config' has invalid keys: local_smtp
  ```
- **Root Cause**:
  In `supabase/config.toml`:
  1. Line 43: `orioledb_version = ""` under `[db]` is not recognized by Supabase CLI 2.101.0.
  2. Line 106: `[local_smtp]` section is deprecated in Supabase CLI 2.x in favor of `[inbucket]`.
     When Supabase CLI's Viper TOML decoder parses `supabase/config.toml`, it strictly validates table schemas and exits with code 1.
- **Impact on Migrations**:
  **YES**, this defect blocks all CLI database commands (`supabase migration up`, `supabase db push`, `supabase start`, `supabase gen types`), as Viper parses the configuration file before executing any command.
- **Classification**: **AUTO** repository defect (Finding F3-03). Fixable by removing `orioledb_version` and renaming `[local_smtp]` to `[inbucket]`.

---

## 4. Stage B Audit Execution Results (D1 to D10)

### D1: Database & Storage for Phase 3 Tables (Staging)

- **Catalog & Schema Inspection**: Reviewed `supabase/migrations/20261007050000_content.sql` and `20261007060000_gallery.sql`.
  - Tables created: `gallery_items`, `testimonials`, `faqs`, `announcements`.
  - Constraints: Check constraints enforce testimonial rating `rating >= 1 AND rating <= 5`, valid source enum (`google`, `instagram`, `whatsapp`, `direct`), valid FAQ group (`general`, `services`, `jewellery`, `orders_shipping`), valid gallery type (`single`, `before_after`), and announcement `end_date > start_date`.
  - Media delete protection: Foreign keys referencing `media(id)` use `ON DELETE RESTRICT` for gallery `media_id` and `before_media_id`.
  - Service category foreign key: `service_category_id` references `service_categories(id)` with `ON DELETE SET NULL`.
  - Triggers: `update_updated_at_column()` attached to all tables.
  - RLS policies: Enabled on all four tables. Anonymous and non-admin can only read rows where `published = true` (and for announcements, `active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now())`). Writes restricted exclusively to admins.
  - Staging live execution: **NOT RUN** (Safety Guard).

### D2: Admin Actions for Phase 3

- **Authorization & Guards**: All 16 Phase 3 actions enforce `await verifyAdmin()` on line 1.
- **Input Fuzzing**: Zod schemas validate bounds, non-empty strings, and reject injection payloads.
- **Announcement Link Scheme Validation**:
  - `saveAnnouncementSchema` checks link URLs.
  - Test evidence: `javascript:`, `data:`, and `http:` URLs were rejected.
  - **DEFECT**: Protocol-relative URLs (e.g. `//evil.com`) are ACCEPTED by `safeLinkRegex = /^(https:\/\/|\/)/i` because `//` starts with `/`. (Finding F3-01 [AUTO]).
- **Home & About Settings**: Enforces maximum 3 counters (`.max(3)`), non-empty headline, and button enum (`services` | `jewellery`). About settings enforces highlights array and portrait media ID.

### D3: Public Data Layer & Caching

- **Stateless Isolation**: Static scan of `src/lib/data/` and `src/app/(public)/` confirmed zero imports of `cookies()`, `headers()`, `@/lib/supabase/server`, or `@/lib/supabase/admin`.
- **Cache Tags**: Public queries use Next.js `'use cache'` with explicit `cacheTag()`. All tags match the `revalidateCacheTag()` calls in admin actions.
- **Route Classification in Build Output**: All 41 public and marketing routes are static prerendered (○) or partial prerendered (◐).

### D4: Empty-Data Behaviour (EMPTY State)

- Public routes crawled on local production server: `/`, `/services`, `/jewellery`, `/gallery`, `/reviews`, `/faq`, `/about`, `/contact`.
- All routes returned HTTP 200 with branded layout.
- Listings display friendly `EmptyState` component.
- Zero broken internal links found in crawl.

### D5: Content Rendering (FULL State) & HTTP Status Codes

- **WhatsApp Link Builder**: Correctly formats phone numbers to digits only, safely encodes unicode/Tamil script and rupee symbols (`₹`), encodes line breaks, and returns empty string if phone is missing.
- **Contact Page Specification (Requirement 3.8)**: Verified no `<form>` element exists and no `<iframe>` map is embedded. Page renders tap-to-call, mailto, weekly hours, and directions button.
- **FAQ Page Specification (Requirement 3.8)**: Implements native `<details>` and `<summary>` elements.
- **Not-Found Status on Missing Detail Pages**:
  - Request to non-existent route `/non-existent-page-xyz-12345` returns HTTP 404.
  - Request to missing service `/services/missing-slug` returns HTTP 200 with 404 HTML body streamed via Suspense.
  - Request to missing product `/jewellery/missing-cat/missing-prod` returns HTTP 200 with 404 HTML body streamed via Suspense.
  - **Finding F3-02 [NEEDS MY DECISION]**: Suspense boundary streams HTTP 200 response headers before `notFound()` executes in child component.

### D6: Security of Public Output

- **XSS & Escaping**: React JSX automatically escapes user strings. Zero unescaped script tags or inline handlers found in HTML.
- **Anchor Href Safety**: Zero `javascript:`, `data:`, or `vbscript:` schemes found in anchor tags.
- **External Links**: All external links render with `rel="noopener noreferrer"`.
- **Third-Party Scripts**: Zero external `<script src="...">` tags loaded from 3rd party domains.
- **Image Optimizer Endpoint (`/_next/image`)**: Rejects arbitrary external hosts (HTTP 400), internal IP/SSRF addresses (HTTP 400), and disallowed widths (HTTP 400).
- **Data Over-exposure**: Scanned HTML and RSC flight payloads; zero service role keys, admin tokens, or secret keys detected.
- **Robots**: `robots.txt` endpoint responds with HTTP 200 and disallows crawling when indexing is disabled.

### D7: Accessibility & Performance Indicators

- **Landmarks**: Every public page has exactly one `<main>` landmark.
- **Headings**: Every public page has exactly one `<h1>`.
  - _Observation_: On empty listing pages (e.g. `/reviews`, `/faq`), heading level jumps from H1 to H3 because the footer's brand title is `<h3>` and no content `<h2>` elements are rendered. (Finding F3-05 [RECOMMENDATION]).
- **Image Alts**: Every `<img>` tag has an explicit `alt` attribute.
- **Tabindex & IDs**: Zero positive `tabindex` attributes; zero duplicate DOM IDs across all public pages.
- **LCP Image Priority**: At most one priority image (`fetchpriority="high"`) per page.
- **Bundle Sizes (Initial JavaScript per page from Production Build)**:
  - `/`: 198.1 KB Gzip (171.8 KB Brotli)
  - `/services`: 194.3 KB Gzip (168.5 KB Brotli)
  - `/jewellery`: 233.0 KB Gzip (202.9 KB Brotli)
  - `/gallery`: 236.7 KB Gzip (206.1 KB Brotli)
  - `/reviews`: 194.3 KB Gzip (168.5 KB Brotli)
  - `/faq`: 194.3 KB Gzip (168.5 KB Brotli)
  - `/about`: 194.3 KB Gzip (168.5 KB Brotli)
  - `/contact`: 194.3 KB Gzip (168.5 KB Brotli)
  - _Note_: Turbopack + React 19 + Next.js App Router core runtime is ~115 KB gzip; total page bundles are ~194-236 KB gzip. Lightbox in `/gallery` is loaded dynamically (`next/dynamic`) on demand.

### D8: Scale & Query Quality

- Staging seed (500 products, 200 gallery items) and EXPLAIN: **NOT RUN** (Staging Safety Guard).
- **Static Code Audit of Data Layer**:
  - Pagination in `getPublicProducts` uses database range/limits.
  - Queries select explicit column sets rather than unbounded payloads.
  - Queries filter by `published = true` and utilize indexed columns (`category_id`, `sort_order`, `slug`).

### D9: Front-End Code Review (Headless)

- **Mobile Menu**: Keyboard toggle and `aria-expanded` implemented. Escape key handling is missing from `src/components/header.tsx`. (Finding F3-06 [RECOMMENDATION]).
- **Image Lightbox**: Implements full focus trapping, focus restoration on close, Escape key listener, left/right arrow navigation, and body scroll locking.
- **Before/After Slider**: Built with accessible native range input (`<input type="range" min="0" max="100">`), accessible via keyboard arrows and touch drag, with `aria-label` and `aria-valuenow`.
- **Testimonials Carousel**: Implements CSS scroll snap (`snap-x snap-mandatory`), previous/next navigation buttons with accessible names, and NO autoplay.
- **Hero & Marquee**: Hero image renders without opacity animation for LCP optimization; CSS marquee pauses on `:hover` and `:focus-within` and disables animation under `@media (prefers-reduced-motion: reduce)`.
- **Announcement Bar**: Uses `useSyncExternalStore` reading `localStorage` for dismissed announcement persistence with zero hydration flicker.

### D10: Hygiene

- **Package Audit**: `pnpm audit` flagged 1 high severity advisory in `braces <=3.0.3` via `eslint-config-next@16.4.0` (dev dependency only, not bundled in client runtime).
- **Animation Feature Loader**: `motion/react` is strictly used via `LazyMotion` and `domAnimation` in `src/components/public/motion-provider.tsx` and `m` in `reveal.tsx`.
- **Secrets Scan**: Zero service role keys, Supabase JWTs, or private keys found in client bundles or public output.
- **Scratch Files**: Clean workspace root with zero leftover test artifacts.

---

## 5. Comprehensive Test Results Table

| Case ID    | Area          | Method                  | Expected                                               | Actual                                                   | Status      |
| :--------- | :------------ | :---------------------- | :----------------------------------------------------- | :------------------------------------------------------- | :---------- |
| **D1-01**  | Database      | Staging SQL / Catalog   | Phase 3 tables, constraints, foreign keys              | Staging safety guard active                              | **NOT RUN** |
| **D1-02**  | Database      | Staging SQL / RLS       | Anonymous/non-admin read only published rows           | Staging safety guard active                              | **NOT RUN** |
| **D1-03**  | Database      | Staging Storage / FKeys | Media restrict delete on gallery items                 | Staging safety guard active                              | **NOT RUN** |
| **D1-04**  | Database      | CLI / Types             | `pnpm db:types` executes cleanly                       | Fails with invalid keys `orioledb_version`, `local_smtp` | **FAIL**    |
| **D2-01**  | Admin Actions | AST Code Review         | All 16 Phase 3 actions guard `verifyAdmin` first       | All 16 verifyAdmin first statement                       | **PASS**    |
| **D2-02**  | Admin Actions | Schema Validation       | Gallery items: before_after requires both images       | Enforced in saveGalleryItemSchema                        | **PASS**    |
| **D2-03**  | Admin Actions | Schema Validation       | Testimonials rating 1 to 5 and source enum             | Enforced in saveTestimonialSchema                        | **PASS**    |
| **D2-04**  | Admin Actions | Schema Validation       | FAQ non-empty question/answer and group enum           | Enforced in saveFAQSchema                                | **PASS**    |
| **D2-05**  | Admin Actions | Schema Validation       | Announcement reject end before start                   | Enforced in saveAnnouncementSchema                       | **PASS**    |
| **D2-06**  | Admin Actions | Schema Validation       | Announcement reject protocol-relative `//` link        | Accepted by regex (starts with `/`)                      | **FAIL**    |
| **D2-07**  | Admin Actions | Schema Validation       | Home settings max 3 counters & button enum             | Enforced in homeSettingsSchema                           | **PASS**    |
| **D2-08**  | Admin Actions | Schema Validation       | About settings story text & highlights array           | Enforced in aboutSettingsSchema                          | **PASS**    |
| **D2-09**  | Admin Actions | AST Code Review         | Reorder & bulk actions handle empty arrays safely      | Safe array validation in actions                         | **PASS**    |
| **D2-10**  | Admin Actions | AST Code Review         | Mutations revalidate matching public cache tags        | All 16 revalidate correct tag                            | **PASS**    |
| **D3-01**  | Data Layer    | Static Import Scan      | Zero cookies, headers, or admin client in public       | Zero leaks detected in data/public routes                | **PASS**    |
| **D3-02**  | Data Layer    | Code Review             | Stateless client uses anon key & persistSession: false | Verified in getStatelessClient                           | **PASS**    |
| **D3-03**  | Data Layer    | AST Code Review         | Public queries use 'use cache' and cacheTag            | Paired with admin revalidations                          | **PASS**    |
| **D3-04**  | Data Layer    | Next.js Build Output    | Prerendered static / PPR routes in build               | All public routes static or PPR                          | **PASS**    |
| **D4-01**  | Empty Data    | HTTP Fetch Crawl        | All 8 public core routes render 200 in empty state     | All 8 routes return 200 OK                               | **PASS**    |
| **D4-02**  | Empty Data    | HTML Parse              | Friendly EmptyState component displayed                | Renders empty state message                              | **PASS**    |
| **D4-03**  | Empty Data    | HTML Parse              | No floating WhatsApp button when phone missing         | Conditional render verified                              | **PASS**    |
| **D5-01**  | Rendering     | Unit Tests              | WhatsApp builder handles digits, unicode, Tamil, INR   | 100% test cases passed                                   | **PASS**    |
| **D5-02**  | Rendering     | HTTP Fetch / HTML       | Contact page: tap-to-call, mailto, no form, no map     | Conforms strictly to Req 3.8                             | **PASS**    |
| **D5-03**  | Rendering     | HTTP Fetch / HTML       | FAQ page: native details and summary markup            | Native details/summary implemented                       | **PASS**    |
| **D5-04**  | Rendering     | HTTP Fetch              | Non-existent route returns 404                         | Returns HTTP 404 with branded page                       | **PASS**    |
| **D5-05**  | Rendering     | HTTP Fetch              | Missing detail pages return 404 status                 | Returns HTTP 200 (streamed Suspense)                     | **FAIL**    |
| **D6-01**  | Security      | Unit Tests              | Hostile strings escaped in WhatsApp link               | Safe encoded wa.me URLs                                  | **PASS**    |
| **D6-02**  | Security      | HTTP Fetch / Headers    | Security headers (XFO, XCTO, Referrer-Policy)          | All security headers present                             | **PASS**    |
| **D6-03**  | Security      | HTML Parse              | Zero hostile anchor protocols (javascript:, data:)     | All hrefs use safe protocols                             | **PASS**    |
| **D6-04**  | Security      | HTML Parse              | External links use rel="noopener noreferrer"           | All external links protected                             | **PASS**    |
| **D6-05**  | Security      | HTML Parse              | Zero third-party script tags loaded                    | Zero external scripts detected                           | **PASS**    |
| **D6-06**  | Security      | Payload Scan            | Zero secrets or service role keys in public HTML       | Clean HTML and RSC payloads                              | **PASS**    |
| **D6-07**  | Security      | HTTP Fetch              | Image optimizer rejects external, SSRF, bad width      | Returns 400 Bad Request on all                           | **PASS**    |
| **D6-08**  | Security      | HTTP Fetch              | robots.txt reachable and enforces indexing             | Status 200 with Disallow: /                              | **PASS**    |
| **D7-01**  | Accessibility | HTML Parse              | HTML lang present, single main, single h1              | Verified across all public pages                         | **PASS**    |
| **D7-02**  | Accessibility | HTML Parse              | Zero positive tabindex, zero duplicate IDs             | Verified across all public pages                         | **PASS**    |
| **D7-03**  | Accessibility | HTML Parse              | All images possess alt attributes                      | Verified across all public pages                         | **PASS**    |
| **D7-04**  | Performance   | Production Build        | Initial JS measured per page from build                | 194-236 KB Gzip measured                                 | **PASS**    |
| **D7-05**  | Performance   | HTML Parse              | At most one priority LCP image per page                | Verified across all public pages                         | **PASS**    |
| **D8-01**  | Scale         | Staging Seed / EXPLAIN  | Seed 500 products, 200 gallery items & test EXPLAIN    | Staging safety guard active                              | **NOT RUN** |
| **D8-02**  | Scale         | Code Review             | Database-level pagination & explicit column selects    | Verified in data layer queries                           | **PASS**    |
| **D9-01**  | Code Review   | Front-End Review        | Lightbox focus trap, escape, arrow keys, restore       | Verified in image-lightbox.tsx                           | **PASS**    |
| **D9-02**  | Code Review   | Front-End Review        | Before/after slider native range input accessibility   | Verified in before-after-slider.tsx                      | **PASS**    |
| **D9-03**  | Code Review   | Front-End Review        | Carousel scroll snap, navigation buttons, no autoplay  | Verified in testimonials-carousel.tsx                    | **PASS**    |
| **D9-04**  | Code Review   | Front-End Review        | Hero LCP image no opacity animation; marquee pauses    | Verified in home-hero & marquee                          | **PASS**    |
| **D9-05**  | Code Review   | Front-End Review        | Dismissed announcement persistent via localStorage     | Verified in announcement-bar.tsx                         | **PASS**    |
| **D10-01** | Hygiene       | Package Audit           | Package audit scan for vulnerabilities                 | 1 dev advisory in braces (transitive)                    | **PASS**    |
| **D10-02** | Hygiene       | AST Code Review         | Motion library loaded only via LazyMotion/domAnimation | Lazy feature loader verified                             | **PASS**    |
| **D10-03** | Hygiene       | Static Scan             | Zero temporary or scratch files in repository root     | Clean repository root                                    | **PASS**    |

---

## 6. Summary Counts by Area

| Audit Area                          | Cases Total |  PASS  | FAIL  | NOT RUN | REVIEWED IN CODE |
| :---------------------------------- | :---------: | :----: | :---: | :-----: | :--------------: |
| **D1: Database & Storage**          |      4      |   0    |   1   |    3    |        0         |
| **D2: Admin Actions**               |     10      |   9    |   1   |    0    |        0         |
| **D3: Public Data Layer & Caching** |      4      |   4    |   0   |    0    |        0         |
| **D4: Empty-Data Behaviour**        |      3      |   3    |   0   |    0    |        0         |
| **D5: Content Rendering & Status**  |      5      |   4    |   1   |    0    |        0         |
| **D6: Security of Public Output**   |      8      |   8    |   0   |    0    |        0         |
| **D7: Accessibility & Performance** |      5      |   5    |   0   |    0    |        0         |
| **D8: Scale & Query Quality**       |      2      |   1    |   0   |    1    |        0         |
| **D9: Front-End Code Review**       |      5      |   5    |   0   |    0    |        0         |
| **D10: Repository Hygiene**         |      3      |   3    |   0   |    0    |        0         |
| **TOTAL**                           |   **49**    | **42** | **3** |  **4**  |      **0**       |

---

## 7. Findings

### Finding F3-01: Announcement Link Accepts Protocol-Relative URLs

- **Phase**: Phase 3
- **Severity**: **MEDIUM** [AUTO]
- **Requirement Violated**: Requirement 3.2 specifies "announcement link accepts only relative paths and https (reject javascript:, data:, http:, protocol-relative)".
- **Evidence**: `test-d1-d2-admin-actions.mjs` failed check `D2-ANNOUNCEMENT-LINK-SCHEMES`. Payload `{ link_url: "//evil.com" }` was accepted.
- **Root Cause**: In `src/types/content.ts` line 55:
  ```ts
  const safeLinkRegex = /^(https:\/\/|\/)/i;
  ```
  The regex matches any string starting with `/`, including `//evil.com`.
- **Proposed Fix**: Update the Zod refinement / regex to require that relative URLs begin with `/` but do not begin with `//`:
  ```ts
  const isSafe = (val: string) =>
    val.startsWith("https://") ||
    (val.startsWith("/") && !val.startsWith("//"));
  ```
- **Files to Modify**: `src/types/content.ts`
- **Regression Risk**: None. Rejects protocol-relative phishing URLs while preserving valid https and site-relative links.
- **Re-test**: Re-run `node tests/phase-3/test-d1-d2-admin-actions.mjs`.

---

### Finding F3-02: Streamed HTTP 200 Status on Missing Detail Pages

- **Phase**: Phase 3
- **Severity**: **MEDIUM** [NEEDS MY DECISION]
- **Requirement Violated**: Requirements 3.5 & 3.6 specify "unpublished or missing returns not-found".
- **Evidence**: `fetch("http://localhost:3009/services/missing-slug")` and `fetch("http://localhost:3009/jewellery/missing-cat/missing-prod")` return HTTP status `200 OK` (with the branded 404 HTML body inside the streamed response).
- **Root Cause**: In `src/app/(public)/services/[slug]/page.tsx` and `src/app/(public)/jewellery/[category]/[product]/page.tsx`, the outer server page component renders `<Suspense fallback={...}>` before calling the async child component that invokes `notFound()`. In Next.js PPR / streaming, headers (status 200) are emitted immediately when the Suspense boundary starts streaming before the child resolves.
- **Resolution Options**:
  - **Option A (Recommended)**: In the outer server page component, pre-fetch/verify entity existence before rendering `<Suspense>`. If missing or unpublished, call `notFound()` in the outer page before Suspense streams headers. This returns a real HTTP status 404 header.
  - **Option B**: Retain existing PPR streaming architecture where the client receives status 200 with the 404 HTML body streamed progressively.
- **Status**: **NEEDS MY DECISION** (Awaiting user choice per Fix Rule 1 & 6).

---

### Finding F3-03: Supabase CLI Config Parser Defect in `supabase/config.toml`

- **Phase**: Phase 1/2/3 Tooling Defect
- **Severity**: **HIGH** [AUTO]
- **Requirement Violated**: Part 0.3 requirement: `pnpm db:types` and CLI migration execution blocked by configuration decoding error.
- **Evidence**: Running `pnpm db:types` fails with exit code 1:
  ```text
  failed to parse config: decoding failed due to the following error(s):
  'db' has invalid keys: orioledb_version
  'config.config' has invalid keys: local_smtp
  ```
- **Root Cause**: In `supabase/config.toml`:
  1. Line 43: `orioledb_version = ""` is not a valid field in Supabase CLI 2.x config schema.
  2. Line 106: `[local_smtp]` is deprecated and replaced by `[inbucket]`.
- **Proposed Fix**: Comment out or remove `orioledb_version = ""` and replace `[local_smtp]` with `[inbucket]`.
- **Files to Modify**: `supabase/config.toml`
- **Regression Risk**: None. Restores full compatibility with Supabase CLI commands.
- **Re-test**: Run `pnpm db:types`.

---

### Finding F3-04: Staging Database & Storage Safety Guard Active

- **Phase**: Cross-Cutting Testing Environment
- **Severity**: **MEDIUM** [USER ACTION]
- **Requirement Violated**: Testing Rule 2 & Part 0 database execution.
- **Evidence**: `.env.test.local` does not exist; `ALLOW_DB_TESTS` and `TEST_PROJECT_REF` are unset.
- **Root Cause**: Staging credentials have not been provided in `.env.test.local`.
- **User Action Required**: Provide `.env.test.local` containing:
  ```env
  ALLOW_DB_TESTS=staging-confirmed
  TEST_PROJECT_REF=<your-staging-project-ref>
  NEXT_PUBLIC_SUPABASE_URL=https://<your-staging-project-ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
  ```
- **Status**: **USER ACTION**.

---

### Finding F3-05: Heading Level Hierarchy on Empty Listing Pages

- **Phase**: Phase 3
- **Severity**: **RECOMMENDATION** [RECOMMENDATION]
- **Requirement**: D7 Heading hierarchy (no levels skipped).
- **Evidence**: On empty pages (e.g. `/reviews` with 0 testimonials), the page has `<h1>` and the next heading is the global footer's `<h3>` ("Nandhinimakeup & Jewellery"), skipping `<h2>`.
- **Recommendation**: Wrap empty state messages with an `<h2>` heading or adjust footer heading hierarchy to use `<h2>`.

---

### Finding F3-06: Mobile Navigation Drawer Escape Key Listener

- **Phase**: Phase 3
- **Severity**: **RECOMMENDATION** [RECOMMENDATION]
- **Requirement**: D9 Keyboard accessibility on mobile menu.
- **Evidence**: `src/components/header.tsx` toggles menu via button click and closes on link navigation, but does not attach a `keydown` listener to close on `Escape`.
- **Recommendation**: Add an `Escape` key event listener to `Header` when `isOpen === true`.

---

## 8. Fix Plan in Ordered Batches

### Batch 1 (AUTO Fixes - To be executed in Stage D)

1. **Fix F3-01**: Update `safeLinkRegex` in `src/types/content.ts` to reject protocol-relative `//` URLs.
2. **Fix F3-03**: Fix `supabase/config.toml` by removing `orioledb_version = ""` and replacing `[local_smtp]` with `[inbucket]`.

### Items Requiring Decision (NEEDS MY DECISION)

1. **Finding F3-02**: Streamed HTTP 200 on missing detail pages.
   - _Recommendation_: Approve Option A to pre-fetch entity presence in the outer server component, emitting HTTP 404 headers before streaming.

### Items Requiring User Action (USER ACTION)

1. **Finding F3-04**: Staging Database & Storage Safety Guard.
   - User must supply `.env.test.local` with valid staging credentials to run live database cases.

---

## 9. NOT RUN Items & What Must Be Provided

The following cases could not be run because the staging database guard is active:

1. **Part 0 / Phase 1**: B3-01, B3-02, B3-03, B3-04, B3-05, B4-03, live login matrix, live type comparison.
2. **Part 0 / Phase 2**: C2-01, C2-02, C2-03, C2-12, C4-04, C4-05, C5-03, C5-04, C6-05, C7-07.
3. **Phase 3**: D1-01, D1-02, D1-03, D8-01 (database seed and EXPLAIN).

**What User Must Provide**:

- Create git-ignored `.env.test.local` in the project root with:
  ```env
  ALLOW_DB_TESTS=staging-confirmed
  TEST_PROJECT_REF=<project-ref>
  NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
  ```

---

## 10. Manual Browser Check List for User

Because this automated audit is conducted entirely without a browser, the following visual and physical device checks should be verified manually in a desktop and mobile browser:

1. **Before/After Slider**: Touch-drag handle on mobile iOS/Android to verify smooth pointer tracking and responsive boundary clipping.
2. **Image Lightbox**: Open image in `/gallery`, verify background backdrop blur, full-screen centering, pinch-to-zoom behavior on mobile, and smooth swipe.
3. **Sticky Header Transition**: Scroll down page to verify sticky header backdrop blur and elevation shadow.
4. **Testimonials Carousel**: Swipe horizontally on mobile touch screen to verify CSS scroll snap aligns cleanly to individual cards.
5. **Reduced Motion**: Enable "Reduce Motion" in Windows/macOS accessibility settings and verify smooth scroll, marquee ticker, and hero animations are disabled.

---

## 11. Stage E Re-Test Results & Final Status

### 11.1 Execution Summary of Fix Batches

| Batch | Findings Closed | Description | Modified Files | Commit Hash |
| :--- | :--- | :--- | :--- | :--- |
| **Batch 1 (AUTO)** | **F3-01**, **F3-03** | Rejected protocol-relative `//` URLs in announcements; fixed Supabase CLI `config.toml` decoding keys (`orioledb_version`, `[inbucket]`) | `src/types/content.ts`, `supabase/config.toml` | `328e073` |

### 11.2 Definitive Before vs After Test Summary

| Audit Area | Cases Total | Before PASS | Before FAIL | After PASS | After FAIL | NOT RUN (Staging Guard) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **D1: Database & Storage** | 4 | 0 | 1 | **1** | 0 | 3 |
| **D2: Admin Actions** | 10 | 9 | 1 | **10** | 0 | 0 |
| **D3: Public Data Layer & Caching** | 4 | 4 | 0 | **4** | 0 | 0 |
| **D4: Empty-Data Behaviour** | 3 | 3 | 0 | **3** | 0 | 0 |
| **D5: Content Rendering & Status** | 5 | 4 | 1 | **4** | 1* (F3-02 Decision) | 0 |
| **D6: Security of Public Output** | 8 | 8 | 0 | **8** | 0 | 0 |
| **D7: Accessibility & Performance**| 5 | 5 | 0 | **5** | 0 | 0 |
| **D8: Scale & Query Quality** | 2 | 1 | 0 | **1** | 0 | 1 |
| **D9: Front-End Code Review** | 5 | 5 | 0 | **5** | 0 | 0 |
| **D10: Repository Hygiene** | 3 | 3 | 0 | **3** | 0 | 0 |
| **TOTAL** | **49** | **42** | **3** | **44** | **1\*** | **4** |

*\*Note: Case D5-05 (HTTP status 200 on streamed 404 detail pages) is open under NEEDS MY DECISION (Finding F3-02).*

### 11.3 Suite Execution Commands

- **Phase 1 Test Suite**: `node tests/phase-1/run-all.mjs` (All non-db cases PASS)
- **Phase 2 Test Suite**: `node tests/phase-2/run-all.mjs` (76/76 PASS)
- **Phase 3 Test Suite**: `node tests/phase-3/run-all.mjs` (35/36 PASS, 1 recorded finding)

### 11.4 Environment Cleanup Confirmation

1. **Build Artifacts**: Rebuilt via `pnpm run build` with default `.env.local`. Zero staging-configured bundles remain in `.next/`.
2. **Workspace**: Clean; zero temporary or scratch files.
3. **Staging Artifacts**: Zero `zz_test_` rows or storage objects created on staging due to the active safety guard.

