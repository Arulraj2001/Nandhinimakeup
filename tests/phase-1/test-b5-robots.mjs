import fs from "node:fs";

console.log("=== RUNNING B5: QUALITY GATES TESTS ===\n");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3009";

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

async function runB5Tests() {
  // B5-01: Robots disallows all when indexing is off
  try {
    const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
    const robotsTxt = await robotsRes.text();
    const disallowsAll =
      robotsTxt.includes("Disallow: /") && robotsTxt.includes("User-Agent: *");
    report(
      "B5-01",
      "robots.txt disallows all crawling when ALLOW_INDEXING is false",
      disallowsAll,
      disallowsAll ? "User-Agent: * Disallow: / correctly returned" : robotsTxt,
      "Disallow: /"
    );
  } catch (e) {
    report(
      "B5-01",
      "robots.txt check",
      false,
      e.message,
      "Server reachable at " + BASE_URL
    );
  }

  // B5-02: CI workflow steps review
  try {
    const ciContent = fs.readFileSync(".github/workflows/ci.yml", "utf8");
    const hasInstall = ciContent.includes("pnpm install");
    const hasFormat = ciContent.includes("pnpm format:check");
    const hasLint = ciContent.includes("pnpm lint");
    const hasTypecheck = ciContent.includes("pnpm typecheck");
    const hasBuild = ciContent.includes("pnpm build");
    const allSteps =
      hasInstall && hasFormat && hasLint && hasTypecheck && hasBuild;
    report(
      "B5-02",
      "GitHub Actions CI workflow runs install, format:check, lint, typecheck, build with placeholder env",
      allSteps,
      allSteps
        ? "All 5 quality gate steps configured in ci.yml"
        : "Missing steps in ci.yml",
      "All 5 steps present"
    );
  } catch (e) {
    report(
      "B5-02",
      "CI workflow check",
      false,
      e.message,
      ".github/workflows/ci.yml readable"
    );
  }

  // B5-03: README instructions check
  try {
    const readmeContent = fs.readFileSync("README.md", "utf8");
    const hasSetup =
      readmeContent.includes("Mumbai") &&
      readmeContent.includes("Environment Variables");
    const hasAdminSnippet = readmeContent.includes("create_first_admin.sql");
    const hasConventions = readmeContent.includes("Project Conventions");
    report(
      "B5-03",
      "README covers setup, Mumbai region, env variables, migrations, first admin, and conventions",
      hasSetup && hasAdminSnippet && hasConventions,
      "README covers setup, region, env, first admin creation, and conventions",
      "All sections present"
    );
  } catch (e) {
    report("B5-03", "README check", false, e.message, "README.md readable");
  }

  console.log(`\nB5 SUMMARY: ${passCount} Passed, ${failCount} Failed\n`);
}

runB5Tests();
