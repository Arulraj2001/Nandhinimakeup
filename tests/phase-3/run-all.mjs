import { execSync } from "node:child_process";

console.log("========================================================");
console.log("      PHASE 3 REUSABLE TEST SUITE EXECUTION             ");
console.log("========================================================\n");

const scripts = [
  "tests/phase-3/test-d1-d2-admin-actions.mjs",
  "tests/phase-3/test-d3-data-layer.mjs",
  "tests/phase-3/test-d4-d5-rendering.mjs",
  "tests/phase-3/test-d6-security-escaping.mjs",
  "tests/phase-3/test-d7-d10-a11y-perf-hygiene.mjs",
];

let totalFailed = 0;

for (const s of scripts) {
  try {
    execSync(`node ${s}`, { stdio: "inherit" });
  } catch (err) {
    console.error(`\n[ERROR] Failure detected during execution of ${s}`);
    totalFailed++;
  }
}

console.log("\n========================================================");
if (totalFailed === 0) {
  console.log("ALL PHASE 3 SUITE TESTS COMPLETED SUCCESSFULLY");
} else {
  console.log(
    `PHASE 3 SUITE FINISHED WITH ${totalFailed} SCRIPT ERROR(S) / TEST FAILURE(S)`
  );
}
console.log("========================================================\n");

if (totalFailed > 0) {
  process.exit(1);
}
