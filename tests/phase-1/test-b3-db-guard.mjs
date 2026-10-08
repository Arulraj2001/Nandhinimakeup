import fs from 'node:fs';

console.log('=== RUNNING B3: SUPABASE FOUNDATION GUARD & SCHEMA TESTS ===\n');

let passCount = 0;
let failCount = 0;
let notRunCount = 0;

function report(id, description, status, actual, expected) {
  if (status === 'NOT RUN') {
    console.log(`[NOT RUN] ${id}: ${description}`);
    console.log(`  Reason:   ${actual}`);
    notRunCount++;
  } else if (status === 'PASS') {
    console.log(`[PASS] ${id}: ${description}`);
    passCount++;
  } else if (status === 'REVIEWED IN CODE') {
    console.log(`[REVIEWED IN CODE] ${id}: ${description}`);
    console.log(`  Details:  ${actual}`);
    passCount++;
  } else {
    console.log(`[FAIL] ${id}: ${description}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual:   ${actual}`);
    failCount++;
  }
}

// B3-01: Staging Database Guard Check
const allowDbTests = process.env.ALLOW_DB_TESTS === 'staging-confirmed';
const testProjectRef = process.env.TEST_PROJECT_REF;
const hasProjectRef = Boolean(testProjectRef);

if (!allowDbTests || !hasProjectRef) {
  const missingReasons = [];
  if (!allowDbTests) missingReasons.push(`ALLOW_DB_TESTS is "${process.env.ALLOW_DB_TESTS || '(not set)'}" (must be "staging-confirmed")`);
  if (!hasProjectRef) missingReasons.push(`TEST_PROJECT_REF is "${process.env.TEST_PROJECT_REF || '(not set)'}"`);
  
  report(
    'B3-GUARD',
    'Staging database test execution safety guard',
    'NOT RUN',
    `Database tests disabled: ${missingReasons.join('; ')}. Set ALLOW_DB_TESTS=staging-confirmed and TEST_PROJECT_REF=<project-ref> to run live SQL/RLS checks.`,
    'ALLOW_DB_TESTS=staging-confirmed and TEST_PROJECT_REF set'
  );

  report(
    'B3-01',
    'Database schema catalog inspection (admins, site_settings, seo_pages, redirects)',
    'NOT RUN',
    'Requires live staging database connection.',
    'Schema tables inspected'
  );

  report(
    'B3-02',
    'Database constraint behavior (duplicates rejection, check constraints, cascade on delete)',
    'NOT RUN',
    'Requires live staging database connection.',
    'Constraint behavior verified'
  );

  report(
    'B3-03',
    'Updated-at triggers and is_admin() function execution against live database',
    'NOT RUN',
    'Requires live staging database connection.',
    'Triggers and functions verified'
  );

  report(
    'B3-04',
    'RLS 4-identity permission matrix (anon, non-admin, admin, service_role)',
    'NOT RUN',
    'Requires live staging database connection.',
    'RLS matrix evaluated'
  );

  report(
    'B3-05',
    'Public signup disabled verification on live Supabase Auth instance',
    'NOT RUN',
    'Requires live staging database connection.',
    'Signup rejected'
  );
}

// B3-06: Static Code Review of Helpers & Migration
try {
  const clientHelper = fs.readFileSync('src/lib/supabase/client.ts', 'utf8');
  const serverHelper = fs.readFileSync('src/lib/supabase/server.ts', 'utf8');
  const adminHelper = fs.readFileSync('src/lib/supabase/admin.ts', 'utf8');

  const clientOk = !clientHelper.includes('SERVICE_ROLE') && clientHelper.includes('createBrowserClient');
  const serverOk = serverHelper.includes('cookies()') && serverHelper.includes('createServerClient');
  const adminOk = adminHelper.includes('import "server-only"') && adminHelper.includes('SUPABASE_SERVICE_ROLE_KEY');

  report(
    'B3-06',
    'Supabase client helpers structure (browser, server with cookies, admin with server-only guard)',
    clientOk && serverOk && adminOk ? 'PASS' : 'FAIL',
    `browser: ${clientOk}, server: ${serverOk}, admin: ${adminOk}`,
    'All three helpers properly structured'
  );

  // Review RLS policies in migration
  const fixMigrationPath = 'supabase/migrations/20261008080000_fix_admins_rls_writes.sql';
  const hasFixMigration = fs.existsSync(fixMigrationPath);
  let fixMigrationContent = '';
  if (hasFixMigration) {
    fixMigrationContent = fs.readFileSync(fixMigrationPath, 'utf8');
  }
  const dropsWrites = fixMigrationContent.includes('drop policy if exists "Admins can insert admin records"') &&
                      fixMigrationContent.includes('drop policy if exists "Admins can update admin records"') &&
                      fixMigrationContent.includes('drop policy if exists "Admins can delete admin records"');

  if (hasFixMigration && dropsWrites) {
    report(
      'B3-07',
      'admins table RLS policy: writes restricted exclusively to service-role',
      'PASS',
      'Migration 20261008080000_fix_admins_rls_writes.sql explicitly drops authenticated write policies, leaving writes strictly service-role only',
      'Service-role only'
    );
  } else {
    report(
      'B3-07',
      'admins table RLS policy: writes restricted exclusively to service-role',
      'FAIL',
      'Initial migration grants insert/update/delete to authenticated admins and no fix migration drops them',
      'No identity except service role can insert, update or delete in admins table'
    );
  }

} catch (e) {
  report('B3-06', 'Client helpers check', 'FAIL', e.message, 'Helpers exist');
}

console.log(`\nB3 SUMMARY: ${passCount} Passed, ${failCount} Failed, ${notRunCount} Not Run\n`);
