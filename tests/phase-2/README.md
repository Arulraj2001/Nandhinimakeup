# Phase 2 (Admin Core) Test Suite

This directory contains automated, headless test runners for auditing Phase 2 (Admin Core) requirements of the application:

1. **`test-action-inventory.mjs`**: Audits all server actions in `src/lib/actions`, verifying authentication guards (`verifyAdmin()`), input validation (`zod`), cache revalidation (`revalidateCacheTag`), and typed result shapes (`ActionResult<T>`).
2. **`test-c1-actions-helpers.mjs`**: Unit tests for slug helper (`slugify`), currency helper (`formatINR`), search parameter sanitization, and client bundle isolation between public and admin routes.
3. **`test-c2-media-logic.mjs`**: Tests media library MIME type validation (JPEG, PNG, WebP), 15 MB file size boundary limits, native image dimension calculation, and storage path safety.
4. **`test-c3-settings-logic.mjs`**: Audits settings schema validation across all groups (Business, Social, Payments, Shipping, Branding, Analytics), defaults fallback, and confidentiality.
5. **`test-c4-c5-c6-catalog-logic.mjs`**: Audits schema validation and business rules for services, product categories, and products (price rules, publishing image requirements, stock tracking).
6. **`test-c7-migrations.mjs`**: Verifies Phase 2 migration files immutability, absence of seed data, Row Level Security enforcement, updated_at triggers, and foreign key cascade/restrict integrity.
7. **`test-c8-c9-front-end-hygiene.mjs`**: Code review verification for confirmation dialogs, drag-and-drop keyboard accessibility, form loading guards, and secrets leakage scanning.

## Running the Suite

Execute all tests:

```bash
node tests/phase-2/run-all.mjs
```

Or execute individual test suites:

```bash
node tests/phase-2/test-c1-actions-helpers.mjs
node tests/phase-2/test-c2-media-logic.mjs
node tests/phase-2/test-c3-settings-logic.mjs
node tests/phase-2/test-c4-c5-c6-catalog-logic.mjs
node tests/phase-2/test-c7-migrations.mjs
node tests/phase-2/test-c8-c9-front-end-hygiene.mjs
```
