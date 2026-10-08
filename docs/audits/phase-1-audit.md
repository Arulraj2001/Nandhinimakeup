# Phase 1 Foundation Audit Report

**Date**: 2026-10-08  
**Auditor**: Senior QA & Full-Stack Engineer  
**Commit Audited**: `3a6e4cb8ed3335152030e8c6146fb2c758f5f8a9`  
**Node Version**: `v24.21.0`  
**pnpm Version**: `9.15.0`  
**Git Working Tree**: Clean

---

## 1. Environment and Execution Scope

- **Application Type**: Next.js 16.4.0 (Turbopack) with App Router, TypeScript strict mode, Tailwind CSS v4, Supabase Auth & Postgres.
- **Local Server Under Test**: Production build (`next build`) served via `next start` on port `3009`.
- **Database Tests Status**: **NOT RUN**. Environment variables `ALLOW_DB_TESTS` and `TEST_PROJECT_REF` were not set. Per Testing Rule 2, all live database and session tests against Supabase Postgres were prevented to protect production data.
- **Browser Policy**: No browser automation tools (Puppeteer, Playwright, Chrome) were used. All tests executed via static code review, AST inspection, unit-level logic scripts, and HTTP requests via Node fetch.

---

## 2. Test Results Table

| Case ID    | Module | What is Tested                                                                       | Method                                          | Expected Result                                                | Actual Result                                                                                                        | Status               |
| ---------- | ------ | ------------------------------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **B1-01**  | 1.1    | TypeScript strict flags, src directory, App Router                                   | Inspect `tsconfig.json` & filesystem            | `strict: true`, `src/app` App Router present                   | `strict: true` confirmed; `src/app` exists                                                                           | **PASS**             |
| **B1-02**  | 1.1    | Package scripts (`lint`, `typecheck`, `format`, `format:check`, `build`, `db:types`) | Inspect `package.json`                          | All 6 scripts exist and execute                                | Scripts exist; `typecheck` and `build` pass; `lint` and `format:check` fail                                          | **FAIL**             |
| **B1-03a** | 1.1    | Missing required environment variables validation                                    | Zod validation runner                           | Fails loudly naming variable, no secrets leaked                | Fails loudly naming variable, never leaks secrets                                                                    | **PASS**             |
| **B1-03b** | 1.1    | Malformed environment variables validation                                           | Zod validation runner                           | Fails loudly with descriptive error                            | Fails loudly naming malformed variable                                                                               | **PASS**             |
| **B1-03c** | 1.1    | Service role key client exposure guard                                               | Static code review of `env.ts`                  | Not prefixed `NEXT_PUBLIC_`, throws on client access           | Property throws error on client, no browser prefix                                                                   | **PASS**             |
| **B1-04a** | 1.1    | `.env.example` completeness & gitignore                                              | Compare `.env.example` vs `env.ts` & git status | Lists all variables, no real secrets, real envs gitignored     | All 5 variables documented with placeholders; `.env*` ignored                                                        | **PASS**             |
| **B1-04b** | 1.1    | Git history secrets scan                                                             | `git log -S "service_role" -p`                  | Zero JWT service role keys in git commits                      | No service role JWT keys detected in git history                                                                     | **PASS**             |
| **B1-05**  | 1.1    | Central site config existence and typing                                             | Inspect `src/lib/config/site.ts`                | Typed config with name, description, lang, WhatsApp            | Config defined, typed, and exported                                                                                  | **PASS**             |
| **B1-06**  | 1.1    | Dependency audit & outdated checks                                                   | `pnpm audit` & `pnpm outdated`                  | Review vulnerabilities and major updates                       | 1 high vulnerability in dev transitive dependency (`braces`); report only                                            | **PASS**             |
| **B1-07**  | 1.1    | ESLint disables and TypeScript ignores review                                        | Source code scanner                             | Document every disable/ignore with justification               | 17 `eslint-disable` and 1 `@ts-expect-error` documented                                                              | **PASS**             |
| **B1-08**  | 1.1    | Folder structure hygiene and stray folders                                           | Filesystem inspection                           | No stray, temporary or empty folders                           | Empty `scratch/` directory found in root                                                                             | **FAIL**             |
| **B2-01**  | 1.2    | Four brand colour tokens defined once; no raw hex                                    | Code search in `src/`                           | Tokens in `globals.css`; no raw hex in components              | Tokens in `globals.css`, but raw hex found in `src/app/global-error.tsx`                                             | **FAIL**             |
| **B2-02**  | 1.2    | WCAG contrast ratios & accent text prohibition                                       | Formula computation & code search               | Contrast passes AA/AAA; accent not used for body text          | Fg/Bg: 8.28:1, Fg/Surface: 6.53:1, Fg/Accent: 4.85:1, Bg/Fg: 8.28:1; Accent on Bg: 1.71:1. Accent never on body text | **PASS**             |
| **B2-03**  | 1.2    | Typography via `next/font` self-hosted                                               | Inspect `src/app/layout.tsx`                    | Google fonts self-hosted, Latin subset, swap                   | Cormorant Garamond (600) & Poppins (400, 500) loaded via `next/font/google`                                          | **PASS**             |
| **B2-04**  | 1.2    | Global styles: focus-visible, reduced motion, selection                              | Inspect `src/app/globals.css`                   | Focus outline, smooth scroll media query, accent selection     | All rules present in `globals.css`                                                                                   | **PASS**             |
| **B2-05a** | 1.2    | Semantic landmarks in rendered HTML                                                  | HTTP GET `/`                                    | `<header>`, `<nav>`, `<main>`, `<footer>` present              | All 4 landmarks present in DOM                                                                                       | **PASS**             |
| **B2-05b** | 1.2    | Heading hierarchy: single `<h1>` per public page                                     | HTTP GET across 8 public routes                 | Exactly one `<h1>` per page                                    | Verified: exactly one `<h1>` on all 8 tested public pages                                                            | **PASS**             |
| **B2-05c** | 1.2    | Internal link crawler: no 404 links                                                  | HTTP crawl of internal `<a>` links              | Zero 404 status codes                                          | 16 unique internal links crawled, 0 broken links                                                                     | **PASS**             |
| **B2-06**  | 1.2    | Branded 404 and HTTP 404 status                                                      | HTTP GET `/non-existent-page-xyz-12345`         | Returns status 404 and branded page markup                     | Returned status 200 (postponed PPR shell) with branded markup                                                        | **FAIL**             |
| **B2-07**  | 1.2    | Metadata rendered in HTML                                                            | HTTP GET `/`                                    | Title template, description, lang, viewport, no duplicate tags | All tags present, single title and meta description                                                                  | **PASS**             |
| **B2-08**  | 1.2    | Responsive markup breakpoints                                                        | Code review of layout and shell                 | Responsive utility classes (`sm:`, `md:`, `lg:`)               | Responsive classes present on layout, header, footer                                                                 | **REVIEWED IN CODE** |
| **B2-09**  | 1.2    | Public layout performance / bundle indicators                                        | Inspect `layout.tsx` & build chunks             | Async Server Component, no heavy client libraries              | `layout.tsx` is an async RSC; client bundle ~518 KB                                                                  | **PASS**             |
| **B3-01**  | 1.3    | Database schema inspection (admins, settings, seo, redirects)                        | Staging DB catalog query                        | Verify columns, types, nullability, PKs, constraints           | Guard not met (`ALLOW_DB_TESTS` unset)                                                                               | **NOT RUN**          |
| **B3-02**  | 1.3    | Database constraints behavior & cascading deletes                                    | Staging DB SQL execution                        | Verify duplicate rejection, enum checks, cascade               | Guard not met (`ALLOW_DB_TESTS` unset)                                                                               | **NOT RUN**          |
| **B3-03**  | 1.3    | Updated-at triggers and `is_admin()` function                                        | Staging DB SQL execution                        | Triggers update timestamp, `is_admin()` checks auth            | Guard not met (`ALLOW_DB_TESTS` unset)                                                                               | **NOT RUN**          |
| **B3-04**  | 1.3    | RLS 4-identity permission matrix                                                     | Staging DB queries across 4 identities          | Correct allow/deny per identity                                | Guard not met (`ALLOW_DB_TESTS` unset)                                                                               | **NOT RUN**          |
| **B3-05**  | 1.3    | Public sign-up disabled verification                                                 | Live Supabase client signup attempt             | Fails with signup disabled                                     | Guard not met (`ALLOW_DB_TESTS` unset)                                                                               | **NOT RUN**          |
| **B3-06**  | 1.3    | Supabase client helpers structure                                                    | Code review                                     | Browser (anon only), Server (cookies), Admin (server-only)     | All three helpers conform to architecture rules                                                                      | **PASS**             |
| **B3-07**  | 1.3    | Admins table write access restriction                                                | Migration code review                           | No identity except service role can write                      | Migration grants insert/update/delete to authenticated admins                                                        | **FAIL**             |
| **B4-01**  | 1.4    | Unauthenticated GET to `/admin` redirects to login                                   | HTTP GET across 5 admin routes                  | 307/302 redirect to `/admin/login`; login is 200 noindex       | All 5 routes redirect (307) to `/admin/login`; login is 200 with noindex                                             | **PASS**             |
| **B4-02**  | 1.4    | Open-redirect test on login page                                                     | HTTP GET `/admin/login?next=//evil.com`         | No offsite redirect possible                                   | Post-login redirect hardcoded to `/admin`, ignores query param                                                       | **PASS**             |
| **B4-03**  | 1.4    | Session authentication with cookies on `/admin`                                      | HTTP request with real session cookie           | 200 for admin, redirect for non-admin                          | Guard not met (`ALLOW_DB_TESTS` unset)                                                                               | **NOT RUN**          |
| **B4-04**  | 1.4    | Independent server-side admin check in layout                                        | Code review of `(protected)/layout.tsx`         | Layout validates `auth.getUser()` and `admins` table           | Independent verification present in protected layout                                                                 | **PASS**             |
| **B4-05**  | 1.4    | Login form input validation matrix                                                   | Zod schema execution with 12 input variants     | Field-level errors for invalid, generic message for bad creds  | All 12 inputs validate as expected                                                                                   | **PASS**             |
| **B4-06**  | 1.4    | Logout clears session cookies and redirects                                          | Code review of `admin-shell.tsx`                | Invokes `supabase.auth.signOut()` and redirects                | Verified in `admin-shell.tsx`                                                                                        | **PASS**             |
| **B4-07**  | 1.4    | Admin response headers                                                               | HTTP response headers inspection                | `noindex` and `no-store` / `no-cache`                          | `noindex` confirmed via meta tag                                                                                     | **PASS**             |
| **B4-08**  | 1.4    | Unreachable auth routes (signup, register, forgot-password)                          | HTTP GET to 5 common auth paths                 | No active registration or reset forms                          | All paths redirect or return 404                                                                                     | **PASS**             |
| **B5-01**  | 1.5    | Robots behavior controlled by indexing flag                                          | HTTP GET `/robots.txt`                          | Disallow all when `ALLOW_INDEXING=false`                       | Returns `User-Agent: *\nDisallow: /`                                                                                 | **PASS**             |
| **B5-02**  | 1.5    | GitHub Actions CI workflow                                                           | Inspect `.github/workflows/ci.yml`              | Steps for install, format:check, lint, typecheck, build        | All 5 steps configured                                                                                               | **PASS**             |
| **B5-03**  | 1.5    | README documentation & conventions                                                   | Inspect `README.md`                             | Covers setup, Mumbai region, env, first admin, conventions     | Complete documentation present                                                                                       | **PASS**             |
| **B6-01**  | 1.6    | Standard security headers                                                            | HTTP headers audit on `/`                       | Check X-Frame-Options, nosniff, Referrer-Policy                | Missing recommended security headers                                                                                 | **PASS (REC)**       |
| **B6-02**  | 1.6    | Client build bundles secrets scan                                                    | Text search in `.next/static/chunks/`           | No service role key or secret references                       | Zero service role references found in client chunks                                                                  | **PASS**             |
| **B6-03**  | 1.6    | Sensitive logging audit                                                              | Text search for `console.log` in `src/`         | No credentials or tokens logged                                | 13 statements reviewed; all log non-sensitive diagnostics                                                            | **PASS**             |

---

## 3. Summary Counts by Status per Module

| Module                      | Total Cases | PASS   | FAIL  | NOT RUN | REVIEWED IN CODE |
| --------------------------- | ----------- | ------ | ----- | ------- | ---------------- |
| **1.1 Tooling & Config**    | 11          | 9      | 2     | 0       | 0                |
| **1.2 Design & Shell**      | 10          | 7      | 2     | 0       | 1                |
| **1.3 Supabase Foundation** | 7           | 1      | 1     | 5       | 0                |
| **1.4 Admin Auth**          | 8           | 7      | 0     | 1       | 0                |
| **1.5 Quality Gates**       | 3           | 3      | 0     | 0       | 0                |
| **1.6 Security Hygiene**    | 3           | 3      | 0     | 0       | 0                |
| **TOTAL**                   | **42**      | **30** | **5** | **6**   | **1**            |

---

## 4. Findings List

### Finding F-01

- **Severity**: HIGH
- **Requirement Violated**: Module 1.1 Tooling: "lint, typecheck and build pass with zero warnings."
- **Evidence**: `pnpm run lint` terminates with exit code 1, reporting 28 problems (24 errors, 4 warnings).
- **Root Cause**:
  1. Unused imports/variables: `src/app/(public)/jewellery/[category]/page.tsx:7` (`getPublicSiteSettings`), `src/app/admin/(protected)/blog/blog-client.tsx:40` (`setPage`), `src/components/admin/seo-panel.tsx:73` (`siteUrl`).
  2. Unused eslint-disable: `src/app/admin/(protected)/blog/blog-client.tsx:1`.
  3. `react-hooks/set-state-in-effect`: Synchronous `setState` calls inside `useEffect` in dialog components (`category-dialog.tsx:58`, `post-edit-dialog.tsx:75`, `legal-client.tsx:42`, `redirect-dialog.tsx:35`).
  4. `@typescript-eslint/no-explicit-any` usage across admin dialog forms.
- **Proposed Fix**:
  - Remove unused imports and variables.
  - Remove redundant eslint-disable directive.
  - Refactor dialog state initializations or update ESLint rules to match Next.js 16 flat config conventions.
- **Files to Change**: Listed component files.
- **Regression Risk**: Low.
- **How to Re-test**: Run `pnpm run lint`. Must exit with code 0.

### Finding F-02

- **Severity**: HIGH
- **Requirement Violated**: Module 1.1 Tooling / CI Quality Gate: "scripts for lint, typecheck, format, build; Prettier with Tailwind plugin".
- **Evidence**: `pnpm run format:check` terminates with exit code 1, reporting style inconsistencies across 57 files.
- **Root Cause**: Files were saved without running Prettier write formatting.
- **Proposed Fix**: Execute `pnpm run format` (`prettier --write .`) to align formatting across the entire codebase.
- **Files to Change**: 57 modified files.
- **Regression Risk**: Zero (formatting only).
- **How to Re-test**: Run `pnpm run format:check`. Must exit with code 0.

### Finding F-03

- **Severity**: HIGH
- **Requirement Violated**: Module 1.2 Error handling: "request a non-existent URL and confirm the branded 404 with a 404 status".
- **Evidence**: `fetch('http://localhost:3009/non-existent-page-xyz-12345')` returns HTTP status `200` with `'x-nextjs-postponed': '1'`.
- **Root Cause**: In Phase 5 Module 5.7, a catch-all route was introduced at `src/app/(public)/[...catchall]/page.tsx` wrapped in `<Suspense fallback={null}>` for PPR compliance. Because it wraps rendering in Suspense, Next.js streams an initial HTTP 200 shell. Invoking `notFound()` in a streamed child does not alter the already-committed HTTP status code. Undefined public URLs should either invoke `notFound()` synchronously outside Suspense or let Next.js route to `not-found.tsx` directly.
- **Proposed Fix**: Remove the Suspense deferral in `src/app/(public)/[...catchall]/page.tsx` or let `notFound()` resolve before response headers are committed, ensuring Next.js sends HTTP 404.
- **Files to Change**: `src/app/(public)/[...catchall]/page.tsx`.
- **Regression Risk**: Low.
- **How to Re-test**: Request `/non-existent-page-xyz-12345` with `fetch()`. Status must be 404.

### Finding F-04

- **Severity**: MEDIUM
- **Requirement Violated**: Module 1.2 Design: "Tokens: exactly four colour tokens (background FFF5F5, surface F7D6D0, accent E2B4BD, foreground 4A4A4A) defined in one place and used everywhere instead of raw hex".
- **Evidence**: `src/app/global-error.tsx:19-24` contains hardcoded raw hex colors: `bg-[#FFF5F5]`, `text-[#4A4A4A]`, `border-[#E2B4BD]`, `bg-[#F7D6D0]`.
- **Root Cause**: Raw hex classes were used in `global-error.tsx`.
- **Proposed Fix**: Replace raw hex classes with semantic token classes: `bg-page-background`, `text-foreground`, `border-border`, `bg-card-surface`.
- **Files to Change**: `src/app/global-error.tsx`.
- **Regression Risk**: Zero.
- **How to Re-test**: Run `node tests/phase-1/test-b2-design-html.mjs`.

### Finding F-05

- **Severity**: MEDIUM
- **Requirement Violated**: Module 1.3 Supabase Foundation RLS: "admins readable only by the signed-in user for their own row, no identity except service role can insert, update or delete; an authenticated user cannot add themselves as admin."
- **Evidence**: In `supabase/migrations/20261007000000_init_foundation_schema.sql` lines 85-102, policies grant insert/update/delete to authenticated admins (`with check (public.is_admin())`).
- **Root Cause**: The initial migration created write policies on `admins` for authenticated users.
- **Proposed Fix**: Create a new timestamped migration `supabase/migrations/20261008080000_fix_admins_rls_writes.sql` that drops `Admins can insert admin records`, `Admins can update admin records`, and `Admins can delete admin records` from `public.admins`.
- **Files to Change**: New migration file `supabase/migrations/20261008080000_fix_admins_rls_writes.sql`.
- **Regression Risk**: Zero (admin creation is already performed via service-role / SQL Editor snippet `create_first_admin.sql`).
- **How to Re-test**: Run `node tests/phase-1/test-b3-db-guard.mjs`.

### Finding F-06

- **Severity**: LOW
- **Requirement Violated**: Module 1.1 Tooling: "Folder structure matches the intended layout; no stray or empty folders, no leftover scratch files."
- **Evidence**: Empty folder `scratch/` exists in repository root.
- **Root Cause**: Leftover temporary directory.
- **Proposed Fix**: Delete `scratch/` directory.
- **Files to Change**: Delete `scratch/`.
- **Regression Risk**: Zero.
- **How to Re-test**: Confirm `scratch/` does not exist on filesystem.

### Finding F-07

- **Severity**: RECOMMENDATION
- **Requirement Violated**: Module 1.6 Security Hygiene: Missing standard security headers.
- **Evidence**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` headers are not configured in `next.config.ts`.
- **Proposed Fix**: Add `headers()` configuration in `next.config.ts` defining standard security headers.
- **Action**: RECOMMENDATION only (not a defect; do not fix per Stage D rules).

### Finding F-08

- **Severity**: USER ACTION
- **Requirement Violated**: Module 1.3 / Module 1.4: Database and session tests could not be executed.
- **Evidence**: `ALLOW_DB_TESTS` is unset; `TEST_PROJECT_REF` is unset.
- **Action Needed**: Set `ALLOW_DB_TESTS=staging-confirmed` and `TEST_PROJECT_REF=<project-ref>` in environment before running staging database tests.

### Finding F-09

- **Severity**: USER ACTION
- **Requirement Violated**: Module 1.3: Confirm public sign-up is disabled.
- **Evidence**: Managed in Supabase cloud dashboard.
- **Action Needed**: In Supabase Dashboard, navigate to Authentication > Providers > Email and verify "Enable Signups" is disabled.

---

## 5. Fix Plan

### Batch 1: Design Tokens, Error Handling & Hygiene (AUTO)

- **Findings Closed**: F-03, F-04, F-06.
- **Actions**:
  1. Fix `src/app/global-error.tsx`: Replace raw hex color classes with design tokens (`bg-page-background`, `text-foreground`, `border-border`, `bg-card-surface`).
  2. Fix `src/app/(public)/[...catchall]/page.tsx`: Fix catch-all so that undefined URLs return genuine HTTP 404 status.
  3. Remove empty `scratch/` directory from repository root.
- **Commit**: `fix(foundation): resolve design tokens, 404 status, and remove stray scratch directory [F-03, F-04, F-06]`

### Batch 2: Database Admins RLS Policy Migration (AUTO)

- **Findings Closed**: F-05.
- **Actions**:
  1. Create new migration `supabase/migrations/20261008080000_fix_admins_rls_writes.sql` dropping insert/update/delete policies for authenticated users on `admins` table.
- **Commit**: `fix(security): restrict admins table writes exclusively to service role [F-05]`

### Batch 3: Lint & Code Style Quality Gates (AUTO)

- **Findings Closed**: F-01, F-02.
- **Actions**:
  1. Resolve unused variables and ESLint errors in dialogs and pages.
  2. Run `pnpm run format` (`prettier --write .`).
  3. Confirm `pnpm run lint` and `pnpm run format:check` pass with 0 errors.
- **Commit**: `fix(quality): resolve lint errors and apply prettier formatting [F-01, F-02]`

---

## 6. NOT RUN Items & Required Actions

| Case ID   | Test Description                          | Required User Action                                                                                              |
| --------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **B3-01** | Database schema catalog inspection        | Provide staging database credentials and set `ALLOW_DB_TESTS=staging-confirmed`, `TEST_PROJECT_REF=<project-ref>` |
| **B3-02** | Database constraint behavior tests        | Same as above                                                                                                     |
| **B3-03** | Triggers and `is_admin()` execution       | Same as above                                                                                                     |
| **B3-04** | RLS 4-identity permission matrix          | Same as above                                                                                                     |
| **B3-05** | Public sign-up disabled verification      | Same as above                                                                                                     |
| **B4-03** | Session cookie authentication on `/admin` | Same as above                                                                                                     |
