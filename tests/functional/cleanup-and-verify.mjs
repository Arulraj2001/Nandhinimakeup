import fs from "node:fs";
import { adminClient } from "./common.mjs";

console.log("=== RUNNING CLEANUP & RESTORE VERIFICATION ===");

async function cleanupAndVerify() {
  const backup = JSON.parse(fs.readFileSync("tests/functional/settings-backup.json", "utf8"));
  const stage1 = JSON.parse(fs.readFileSync("tests/functional/results/stage1-setup.json", "utf8"));
  let identities = null;
  if (fs.existsSync("tests/functional/identities.json")) {
    identities = JSON.parse(fs.readFileSync("tests/functional/identities.json", "utf8"));
  }

  // 1. Restore site_settings
  console.log("\n1. Restoring Site Settings...");
  // Clear any keys created during test that are not in backup
  const backupKeys = backup.map((b) => b.key);
  const { data: currentSettings } = await adminClient.from("site_settings").select("key");
  if (currentSettings) {
    for (const s of currentSettings) {
      if (!backupKeys.includes(s.key)) {
        await adminClient.from("site_settings").delete().eq("key", s.key);
      }
    }
  }

  for (const item of backup) {
    const { error } = await adminClient
      .from("site_settings")
      .upsert({ key: item.key, value: item.value });
    if (error) {
      console.error(`  Error restoring setting ${item.key}:`, error);
    }
  }

  // Verify site_settings match backup
  const { data: restoredSettings } = await adminClient.from("site_settings").select("key, value");
  let settingsMatch = true;
  for (const b of backup) {
    const r = restoredSettings?.find((s) => s.key === b.key);
    if (!r || JSON.stringify(r.value) !== JSON.stringify(b.value)) {
      settingsMatch = false;
      console.error(`  Mismatch in restored setting [${b.key}]:`, { expected: b.value, actual: r?.value });
    }
  }
  console.log(`  Site settings restored exactly: ${settingsMatch ? "YES (100% MATCH)" : "NO (MISMATCH)"}`);

  // 2. Clean up any zz_test_ rows and storage objects
  console.log("\n2. Cleaning up any test rows & media...");
  // Media files in storage & DB
  const { data: testMedia } = await adminClient
    .from("media")
    .select("id, file_path")
    .ilike("file_name", "zz_test_%");
  if (testMedia && testMedia.length > 0) {
    for (const m of testMedia) {
      await adminClient.storage.from("media").remove([m.file_path]);
      await adminClient.from("media").delete().eq("id", m.id);
    }
    console.log(`  Cleaned up ${testMedia.length} test media items.`);
  } else {
    console.log("  No test media items found.");
  }

  // Clean up any other test objects in storage
  const { data: storageFiles } = await adminClient.storage.from("media").list("uploads");
  if (storageFiles) {
    const testFiles = storageFiles.filter((f) => f.name.startsWith("zz_test_"));
    if (testFiles.length > 0) {
      await adminClient.storage
        .from("media")
        .remove(testFiles.map((f) => `uploads/${f.name}`));
      console.log(`  Cleaned up ${testFiles.length} storage objects.`);
    }
  }

  // Clean test redirects
  await adminClient.from("redirects").delete().ilike("from_path", "%zz%test%");

  // Clean test content
  await adminClient.from("announcements").delete().ilike("message", "%zz_test%");
  await adminClient.from("faqs").delete().ilike("question", "%zz_test%");
  await adminClient.from("testimonials").delete().ilike("client_name", "%zz_test%");
  await adminClient.from("gallery_items").delete().ilike("title", "%zz_test%");
  await adminClient.from("services").delete().ilike("name", "%zz_test%");
  await adminClient.from("service_categories").delete().ilike("name", "%zz_test%");
  await adminClient.from("products").delete().ilike("name", "%zz_test%");
  await adminClient.from("product_categories").delete().ilike("name", "%zz_test%");

  // 3. Delete test users
  console.log("\n3. Deleting test identities...");
  if (identities) {
    if (identities.admin?.userId) {
      await adminClient.from("admins").delete().eq("id", identities.admin.userId);
      await adminClient.auth.admin.deleteUser(identities.admin.userId);
      console.log(`  Deleted zz_test_admin user (${identities.admin.userId})`);
    }
    if (identities.nonadmin?.userId) {
      await adminClient.auth.admin.deleteUser(identities.nonadmin.userId);
      console.log(`  Deleted zz_test_nonadmin user (${identities.nonadmin.userId})`);
    }
  }

  // 4. Verify table row counts against stage 1 baseline
  console.log("\n4. Verifying final row counts against pre-test baseline...");
  const tables = [
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
  ];

  let countsMatch = true;
  const countComparison = {};

  for (const table of tables) {
    const { count, error } = await adminClient
      .from(table)
      .select("*", { count: "exact", head: true });
    const initialCount = stage1.tablesChecked[table]?.count ?? 0;
    const currentCount = error ? "ERROR" : count;
    const match = currentCount === initialCount;
    if (!match) countsMatch = false;

    countComparison[table] = {
      before: initialCount,
      after: currentCount,
      match,
    };
    console.log(`  Table ${table.padEnd(20)}: Before = ${initialCount}, After = ${currentCount} [${match ? "PASS" : "FAIL"}]`);
  }

  const result = {
    settingsRestored: settingsMatch,
    countsMatch,
    countComparison,
    restoredAt: new Date().toISOString(),
  };

  fs.writeFileSync("tests/functional/results/cleanup-and-verify.json", JSON.stringify(result, null, 2));
  console.log("\nVerification complete! Saved to tests/functional/results/cleanup-and-verify.json");
}

cleanupAndVerify().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
