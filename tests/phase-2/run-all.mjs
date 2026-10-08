import { execSync } from "node:child_process";

console.log("========================================================");
console.log("      PHASE 2 (ADMIN CORE) AUTOMATED TEST SUITE        ");
console.log("========================================================\n");

const testScripts = [
  "test-action-inventory.mjs",
  "test-c1-actions-helpers.mjs",
  "test-c2-media-logic.mjs",
  "test-c3-settings-logic.mjs",
  "test-c4-c5-c6-catalog-logic.mjs",
  "test-c7-migrations.mjs",
  "test-c8-c9-front-end-hygiene.mjs",
];

let totalPassed = 0;
let totalFailed = 0;

for (const script of testScripts) {
  try {
    const output = execSync(`node tests/phase-2/${script}`, {
      encoding: "utf8",
      stdio: "pipe",
    });
    console.log(output);

    // Parse pass/fail counts
    const passMatches = output.match(/\[PASS\]/g) || [];
    const failMatches = output.match(/\[FAIL\]/g) || [];
    totalPassed += passMatches.length;
    totalFailed += failMatches.length;
  } catch (err) {
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
    const passMatches = (err.stdout || "").match(/\[PASS\]/g) || [];
    const failMatches = (err.stdout || "").match(/\[FAIL\]/g) || [];
    totalPassed += passMatches.length;
    totalFailed += Math.max(1, failMatches.length);
  }
}

console.log("========================================================");
console.log(
  `TOTAL PHASE 2 TESTS SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`
);
console.log("========================================================\n");
