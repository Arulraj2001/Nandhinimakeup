# Phase 1 Test Suite

This directory contains automated, headless test scripts for testing and auditing Phase 1 (Foundation) of the Nandhini Makeup web application.

## Prerequisites

- Node.js v20.x or v22.x+ (tested on Node v24)
- Local production build running or local dev server:
  ```bash
  pnpm run build
  pnpm exec next start -p 3009
  ```

## Environment Variables

| Variable           | Description                                                           | Required For           |
| ------------------ | --------------------------------------------------------------------- | ---------------------- |
| `TEST_BASE_URL`    | Base URL of running application (defaults to `http://localhost:3009`) | HTTP / HTML tests      |
| `ALLOW_DB_TESTS`   | Must equal `staging-confirmed` to execute database tests              | Staging database tests |
| `TEST_PROJECT_REF` | Supabase project reference matching connection URL                    | Staging database tests |

> **Security Note**: Never commit real database connection strings or service role keys to test files. Database tests run exclusively when the explicit staging guard flags above are supplied.

## Running the Tests

To run the complete suite:

```bash
node tests/phase-1/run-all.mjs
```

Or run individual test modules:

```bash
# Tooling and environment validation
node tests/phase-1/test-b1-env.mjs

# Design system, shell, and rendered HTML
node tests/phase-1/test-b2-design-html.mjs

# Supabase foundation guard and schema review
node tests/phase-1/test-b3-db-guard.mjs

# Admin authentication HTTP tests
node tests/phase-1/test-b4-admin-auth.mjs

# Quality gates (robots, CI, README)
node tests/phase-1/test-b5-robots.mjs

# Cross-cutting security and hygiene
node tests/phase-1/test-b6-security.mjs
```
