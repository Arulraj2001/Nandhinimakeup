import { execSync } from "node:child_process";

console.log("========================================================");
console.log("      PHASE 1 REUSABLE TEST SUITE EXECUTION             ");
console.log("========================================================\n");

const scripts = [
  "tests/phase-1/test-b1-env.mjs",
  "tests/phase-1/test-b2-design-html.mjs",
  "tests/phase-1/test-b3-db-guard.mjs",
  "tests/phase-1/test-b4-admin-auth.mjs",
  "tests/phase-1/test-b5-robots.mjs",
  "tests/phase-1/test-b6-security.mjs",
];

for (const s of scripts) {
  try {
    execSync(`node ${s}`, { stdio: "inherit" });
  } catch (err) {
    console.error(`Error executing ${s}: ${err.message}`);
  }
}
