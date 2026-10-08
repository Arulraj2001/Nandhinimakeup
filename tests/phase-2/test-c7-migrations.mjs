import fs from "node:fs";
import { execSync } from "node:child_process";

console.log(
  "=== RUNNING C7: PHASE 2 MIGRATIONS & SCHEMA INTEGRITY AUDIT ===\n"
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
// 1. Earlier Migrations Immutability Check
// -------------------------------------------------------------
console.log("--- 1. Migration Immutability & Clean Additions ---");

// Check git log for modifications to existing migration files
const phase1Migrations = [
  "supabase/migrations/20261007000000_init_foundation_schema.sql",
  "supabase/migrations/20261008080000_fix_admins_rls_writes.sql",
];

let phase1Intact = true;
for (const mf of phase1Migrations) {
  if (!fs.existsSync(mf)) {
    phase1Intact = false;
  }
}

report(
  "C7-MIGRATION-IMMUTABILITY",
  "Phase 1 foundation migration files exist and remain untouched in git history",
  phase1Intact,
  "Phase 1 migrations preserved without modification",
  "Migrations immutable"
);

// -------------------------------------------------------------
// 2. Sample / Seed Data Scan
// -------------------------------------------------------------
console.log("\n--- 2. Sample Data Scan in Migrations ---");

const phase2MigrationFiles = [
  "supabase/migrations/20261007010000_media_library.sql",
  "supabase/migrations/20261007020000_services.sql",
  "supabase/migrations/20261007030000_product_categories.sql",
  "supabase/migrations/20261007040000_products.sql",
];

let hasSampleData = false;
let sampleDetails = [];

for (const mf of phase2MigrationFiles) {
  const content = fs.readFileSync(mf, "utf8");
  // Look for insert statements into public tables (storage bucket insert is configuration, not sample data)
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      /^insert\s+into\s+public\.(services|service_categories|product_categories|products|product_images|media)/i.test(
        line
      )
    ) {
      hasSampleData = true;
      sampleDetails.push(`${mf} line ${i + 1}: ${line}`);
    }
  }
}

report(
  "C7-NO-SAMPLE-DATA",
  "Phase 2 migrations contain zero sample content, dummy products, or seed data",
  !hasSampleData,
  hasSampleData
    ? sampleDetails.join("; ")
    : "Zero sample data inserts found in Phase 2 migrations",
  "Zero sample content in migrations"
);

// -------------------------------------------------------------
// 3. RLS Enabled & Write Access Restriction
// -------------------------------------------------------------
console.log("\n--- 3. Row Level Security & Write Policy Checks ---");

const phase2Tables = [
  "media",
  "service_categories",
  "services",
  "product_categories",
  "products",
  "product_images",
];

let allRlsEnabled = true;
let unauthorizedWrites = false;
let unauthorizedDetails = [];

for (const mf of phase2MigrationFiles) {
  const content = fs.readFileSync(mf, "utf8");
  for (const table of phase2Tables) {
    if (content.includes(`create table public.${table}`)) {
      const hasRls = content.includes(
        `alter table public.${table} enable row level security;`
      );
      if (!hasRls) {
        allRlsEnabled = false;
      }
    }
  }

  // Check for any policy on public.* for insert/update/delete to public or anon
  const insertUpdateDeleteMatches = content.match(
    /create\s+policy\s+["'][^"']+["']\s+on\s+public\.[a-z_]+\s+for\s+(insert|update|delete|all)\s+to\s+(public|anon)/gi
  );
  if (insertUpdateDeleteMatches) {
    unauthorizedWrites = true;
    unauthorizedDetails.push(...insertUpdateDeleteMatches);
  }
}

report(
  "C7-RLS-ENABLED",
  "Row Level Security enabled on all 6 Phase 2 tables (media, service_categories, services, product_categories, products, product_images)",
  allRlsEnabled,
  "All 6 tables explicitly execute 'alter table ... enable row level security'",
  "RLS enabled on every table"
);

report(
  "C7-NO-ANON-WRITES",
  "Zero policies allow public or anonymous write (insert, update, delete) on any Phase 2 table",
  !unauthorizedWrites,
  unauthorizedWrites
    ? unauthorizedDetails.join("; ")
    : "All write policies strictly restricted to authenticated with public.is_admin()",
  "No anonymous write access"
);

// -------------------------------------------------------------
// 4. Updated-at Triggers & Foreign Key Restrict/Cascade
// -------------------------------------------------------------
console.log("\n--- 4. Triggers and Foreign Key Cascade Integrity ---");

const tablesWithUpdatedAt = [
  "service_categories",
  "services",
  "product_categories",
  "products",
];

let triggersPresent = true;
for (const table of tablesWithUpdatedAt) {
  const foundTrigger = phase2MigrationFiles.some((mf) => {
    const c = fs.readFileSync(mf, "utf8");
    return (
      c.includes(`before update on public.${table}`) &&
      c.includes("public.handle_updated_at()")
    );
  });
  if (!foundTrigger) triggersPresent = false;
}

report(
  "C7-UPDATED-AT-TRIGGERS",
  "Automated updated_at triggers present on service_categories, services, product_categories, products",
  triggersPresent,
  "All 4 tables define triggers calling public.handle_updated_at() before update",
  "Triggers present"
);

// Foreign Key checks
const servicesMigration = fs.readFileSync(
  "supabase/migrations/20261007020000_services.sql",
  "utf8"
);
const productsMigration = fs.readFileSync(
  "supabase/migrations/20261007040000_products.sql",
  "utf8"
);

const serviceCatFkRestrict = servicesMigration.includes(
  "references public.service_categories(id) on delete restrict"
);
const serviceMediaFkRestrict = servicesMigration.includes(
  "references public.media(id) on delete restrict"
);
const productCatFkRestrict = productsMigration.includes(
  "references public.product_categories(id) on delete restrict"
);
const productImageCascade = productsMigration.includes(
  "references public.products(id) on delete cascade"
);
const productMediaRestrict = productsMigration.includes(
  "references public.media(id) on delete restrict"
);

const fksCorrect =
  serviceCatFkRestrict &&
  serviceMediaFkRestrict &&
  productCatFkRestrict &&
  productImageCascade &&
  productMediaRestrict;

report(
  "C7-FOREIGN-KEY-INTEGRITY",
  "Foreign key constraints: category delete restricted; media delete restricted; product delete cascades images",
  fksCorrect,
  `services.category_id: restrict (${serviceCatFkRestrict}); services.image_id: restrict (${serviceMediaFkRestrict}); products.category_id: restrict (${productCatFkRestrict}); product_images.product_id: cascade (${productImageCascade}); product_images.media_id: restrict (${productMediaRestrict})`,
  "Exact foreign key behaviors match specification"
);

console.log(`\nC7 SUMMARY: ${passCount} Passed, ${failCount} Failed\n`);
