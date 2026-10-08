import fs from "node:fs";
import path from "node:path";

console.log("=== C1: SERVER ACTION INVENTORY & AUTHORIZATION AUDIT ===\n");

const actionsDir = "src/lib/actions";
const actionFiles = [
  "media.ts",
  "settings.ts",
  "services.ts",
  "product-categories.ts",
  "products.ts",
  "orders-admin.ts",
  "orders.ts",
  "cart.ts",
  "checkout.ts",
  "gallery.ts",
  "content.ts",
  "blog-admin.ts",
  "legal-pages.ts",
  "redirects-admin.ts",
  "seo-admin.ts",
];

const inventory = [];

for (const file of actionFiles) {
  const filePath = path.join(actionsDir, file);
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath, "utf8");

  // Find all exported async functions
  const fnRegex =
    /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)(?:\s*:\s*Promise<([^>]+)>)?/g;
  let match;

  while ((match = fnRegex.exec(content)) !== null) {
    const fnName = match[1];
    const params = match[2].trim();
    const declaredReturn = match[3] ? match[3].trim() : "inferred";

    // Extract function body up to next export or EOF
    const startIndex = match.index;
    const nextExport = content.indexOf("export async function", startIndex + 1);
    const body = content.slice(
      startIndex,
      nextExport === -1 ? undefined : nextExport
    );

    // Checks
    const isMutation =
      body.includes(".insert(") ||
      body.includes(".update(") ||
      body.includes(".delete(") ||
      body.includes(".upsert(") ||
      body.includes("storage.from");
    const isPublicAction =
      file === "cart.ts" ||
      file === "checkout.ts" ||
      file === "orders.ts" ||
      fnName === "getSiteSettings" ||
      fnName === "getMediaById" ||
      fnName === "getMediaMapByIds" ||
      fnName === "createAutomaticSlugRedirect";

    const callsAdminGuard = body.includes("verifyAdmin()");
    const guardIsFirst =
      callsAdminGuard &&
      body.indexOf("verifyAdmin()") <
        (body.indexOf(".from(") === -1 ? 999999 : body.indexOf(".from("));

    const validatesZod =
      body.includes(".safeParse(") || body.includes(".parse(");
    const callsRevalidate =
      body.includes("revalidateCacheTag(") ||
      body.includes("revalidateTag(") ||
      body.includes("revalidatePath(");

    // Return shape check: returns actionSuccess or actionError or ActionResult
    const usesActionResult =
      body.includes("actionSuccess(") ||
      body.includes("actionError(") ||
      declaredReturn.includes("ActionResult");

    // What it writes
    let writes = "None (Read-only)";
    if (body.includes(".insert(") || body.includes(".upsert("))
      writes = "Insert/Upsert";
    if (body.includes(".update("))
      writes = writes === "None (Read-only)" ? "Update" : writes + ", Update";
    if (body.includes(".delete("))
      writes = writes === "None (Read-only)" ? "Delete" : writes + ", Delete";
    if (body.includes("storage.from"))
      writes = writes === "None (Read-only)" ? "Storage" : writes + ", Storage";

    inventory.push({
      file,
      fnName,
      params,
      isMutation,
      isPublicAction,
      writes,
      callsAdminGuard,
      guardIsFirst,
      validatesZod,
      callsRevalidate,
      usesActionResult,
      declaredReturn,
    });
  }
}

console.log(
  `Audited ${inventory.length} server actions across ${actionFiles.length} action files.\n`
);

let passCount = 0;
let failCount = 0;

console.log("=== PHASE 2 ADMIN CORE ACTIONS AUDIT ===");
const phase2Files = [
  "media.ts",
  "settings.ts",
  "services.ts",
  "product-categories.ts",
  "products.ts",
];
const phase2Actions = inventory.filter((a) => phase2Files.includes(a.file));

for (const a of phase2Actions) {
  const isReadAction = !a.isMutation && a.fnName.startsWith("get");
  const isHelperAction =
    a.fnName === "checkMediaUsage" || a.fnName === "getMediaMapByIds";

  // Guard check: All mutating Phase 2 actions MUST call verifyAdmin first
  let guardPass = true;
  if (a.isMutation) {
    if (!a.callsAdminGuard || !a.guardIsFirst) {
      guardPass = false;
    }
  }

  // Revalidation check: All mutating actions MUST call revalidateCacheTag
  let revalPass = true;
  if (a.isMutation) {
    if (!a.callsRevalidate) {
      revalPass = false;
    }
  }

  // ActionResult check: All actions MUST use ActionResult
  const returnPass = a.usesActionResult || a.fnName === "getSiteSettings"; // getSiteSettings returns typed SiteSettingsData

  const status =
    guardPass && (revalPass || isReadAction || isHelperAction) && returnPass
      ? "PASS"
      : "FAIL";
  if (status === "PASS") passCount++;
  else failCount++;

  console.log(`[${status}] ${a.file} -> ${a.fnName}()`);
  console.log(
    `  Writes: ${a.writes} | Guard First: ${a.guardIsFirst} | Zod: ${a.validatesZod} | Revalidate: ${a.callsRevalidate} | Typed Result: ${returnPass}`
  );
  if (!guardPass)
    console.log(
      `  -> DEFECT: Mutating action does NOT call verifyAdmin() first!`
    );
  if (!revalPass && a.isMutation)
    console.log(`  -> DEFECT: Mutating action does NOT call revalidation!`);
}

console.log(
  `\nPhase 2 Actions Audit Summary: ${passCount} Passed, ${failCount} Failed\n`
);
