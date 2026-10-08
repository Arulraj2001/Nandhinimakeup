# Phase 3 (Public Website and Content Admin) Test Suite

This directory contains automated, headless test runners for auditing and verifying Phase 3 (Public Website and Content Admin) requirements of the application:

1. **`test-d1-d2-admin-actions.mjs`**: Audits all Phase 3 server actions (`gallery.ts`, `content.ts`, `settings.ts`), input schemas (Gallery Items, Testimonials, FAQs, Announcements, Home & About Settings), reorder safety, bulk operations, and cache revalidation tags.
2. **`test-d3-data-layer.mjs`**: Audits public data access modules in `src/lib/data/` for zero cookie/session/admin leakage, verifying stateless public Supabase client usage, cache tag alignments, and Next.js prerender outputs.
3. **`test-d4-d5-rendering.mjs`**: Crawls public routes (`/`, `/services`, `/jewellery`, `/gallery`, `/reviews`, `/faq`, `/about`, `/contact`), verifies WhatsApp builder with unicode and INR formatting, tests empty-state and full-state page renders, checks `/contact` and `/faq` specs, and verifies detail route not-found behavior.
4. **`test-d6-security-escaping.mjs`**: Tests HTML escaping of user inputs, safety of anchor href protocols (blocking `javascript:`, `data:`, `vbscript:`), external link `rel="noopener"`, third-party script isolation, absence of leaked tokens in RSC payloads, Next.js image optimization endpoint security, and robots indexing behavior.
5. **`test-d7-d10-a11y-perf-hygiene.mjs`**: Audits semantic landmarks, heading hierarchy, single H1 rule, zero duplicate IDs, zero positive tabindexes, image alt attributes, compressed initial JavaScript and CSS bundle sizes per route from the production build against the budget, LCP priority candidates, motion library lazy loading, and workspace hygiene.

## Running the Suite

Execute all Phase 3 tests:

```bash
node tests/phase-3/run-all.mjs
```

Or execute individual test suites:

```bash
node tests/phase-3/test-d1-d2-admin-actions.mjs
node tests/phase-3/test-d3-data-layer.mjs
node tests/phase-3/test-d4-d5-rendering.mjs
node tests/phase-3/test-d6-security-escaping.mjs
node tests/phase-3/test-d7-d10-a11y-perf-hygiene.mjs
```
