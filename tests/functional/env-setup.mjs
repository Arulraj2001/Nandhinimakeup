import fs from "node:fs";
import {
  SUPABASE_URL,
  PROJECT_REF,
  adminClient,
  anonClient,
  saveResult,
  createSessionCookieHeader,
} from "./common.mjs";

console.log("=== STAGE 1: SETUP & SAFETY CHECK ===");
console.log(`Connected to Supabase Project Reference: ${PROJECT_REF}`);

async function runSetup() {
  const setupSummary = {
    projectRef: PROJECT_REF,
    tablesChecked: {},
    settingsKeys: [],
    backupCreated: false,
    identitiesCreated: false,
  };

  // 1. Safety check row counts
  console.log("\n--- Checking database tables and existing row counts ---");
  const contentTables = [
    "admins",
    "site_settings",
    "seo_pages",
    "redirects",
    "media",
    "service_categories",
    "services",
    "product_categories",
    "products",
    "product_images",
    "gallery_items",
    "testimonials",
    "faqs",
    "announcements",
    "orders",
    "order_items",
    "legal_pages",
    "blog_categories",
    "blog_posts",
  ];

  for (const table of contentTables) {
    try {
      const { count, error } = await adminClient
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        setupSummary.tablesChecked[table] = { exists: false, error: error.message, count: 0 };
        console.log(`  Table [${table}]: MISSING (${error.message})`);
      } else {
        setupSummary.tablesChecked[table] = { exists: true, count };
        console.log(`  Table [${table}]: EXISTS, ${count} rows`);
      }
    } catch (e) {
      setupSummary.tablesChecked[table] = { exists: false, error: e.message, count: 0 };
      console.log(`  Table [${table}]: EXCEPTION (${e.message})`);
    }
  }

  // Check orders table specifically for safety check (Rule 3)
  if (setupSummary.tablesChecked.orders?.exists) {
    const ordersCount = setupSummary.tablesChecked.orders.count;
    if (ordersCount > 0) {
      // Check if any order does NOT belong to zz_test_
      const { data: realOrders } = await adminClient
        .from("orders")
        .select("id, order_number, customer_name")
        .not("customer_name", "ilike", "zz_test_%")
        .limit(5);

      if (realOrders && realOrders.length > 0) {
        console.error("FATAL SAFETY CHECK: Real customer orders detected in orders table!");
        console.error(realOrders);
        process.exit(1);
      }
    }
  }

  // 2. Settings keys check and backup (Rule 5)
  console.log("\n--- Backing up site_settings (Rule 5) ---");
  const { data: settingsRows, error: settingsErr } = await adminClient
    .from("site_settings")
    .select("*");
  if (settingsErr) throw settingsErr;

  setupSummary.settingsKeys = settingsRows.map((r) => r.key);
  console.log(`  Existing settings keys: ${setupSummary.settingsKeys.join(", ")}`);

  fs.writeFileSync(
    "tests/functional/settings-backup.json",
    JSON.stringify(settingsRows, null, 2),
    "utf8"
  );
  setupSummary.backupCreated = true;
  console.log("  Successfully saved backup to tests/functional/settings-backup.json");

  // 3. Clean up any stale zz_test_ data
  console.log("\n--- Cleaning up any leftover test data ---");
  const { data: userList } = await adminClient.auth.admin.listUsers();
  for (const u of userList?.users || []) {
    if (u.email && u.email.startsWith("zz_test_")) {
      await adminClient.from("admins").delete().eq("user_id", u.id);
      await adminClient.auth.admin.deleteUser(u.id);
      console.log(`  Cleaned user: ${u.email}`);
    }
  }

  // 4. Create test users (Rule 6)
  console.log("\n--- Creating test identities (Rule 6) ---");
  const adminEmail = "zz_test_admin@example.invalid";
  const nonAdminEmail = "zz_test_nonadmin@example.invalid";
  const password = "TestPassword123!@#";

  const { data: adminUser, error: adminCreateErr } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
  });
  if (adminCreateErr) throw adminCreateErr;

  const { error: adminRoleErr } = await adminClient.from("admins").insert({
    user_id: adminUser.user.id,
    role: "owner",
  });
  if (adminRoleErr) throw adminRoleErr;

  const { data: nonAdminUser, error: nonAdminCreateErr } = await adminClient.auth.admin.createUser({
    email: nonAdminEmail,
    password,
    email_confirm: true,
  });
  if (nonAdminCreateErr) throw nonAdminCreateErr;

  // Sign both in to get sessions
  const { data: adminSession, error: adminSignInErr } = await anonClient.auth.signInWithPassword({
    email: adminEmail,
    password,
  });
  if (adminSignInErr) throw adminSignInErr;

  const { data: nonAdminSession, error: nonAdminSignInErr } = await anonClient.auth.signInWithPassword({
    email: nonAdminEmail,
    password,
  });
  if (nonAdminSignInErr) throw nonAdminSignInErr;

  const identities = {
    admin: {
      userId: adminUser.user.id,
      email: adminEmail,
      session: adminSession.session,
      cookieHeader: createSessionCookieHeader(adminSession.session),
    },
    nonAdmin: {
      userId: nonAdminUser.user.id,
      email: nonAdminEmail,
      session: nonAdminSession.session,
      cookieHeader: createSessionCookieHeader(nonAdminSession.session),
    },
  };

  fs.writeFileSync(
    "tests/functional/identities.json",
    JSON.stringify(identities, null, 2),
    "utf8"
  );
  setupSummary.identitiesCreated = true;
  console.log("  Admin identity created and signed in.");
  console.log("  Non-admin identity created and signed in.");
  console.log("  Identities saved to tests/functional/identities.json");

  // Save evidence
  saveResult("stage1-setup.json", setupSummary);
  console.log("\nStage 1 Setup completed successfully! Evidence saved to tests/functional/results/stage1-setup.json\n");
}

runSetup().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
