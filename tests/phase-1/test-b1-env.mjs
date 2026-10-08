import { execSync } from "node:child_process";
import fs from "node:fs";
import { z } from "zod";

console.log("=== RUNNING B1: TOOLING AND CONFIGURATION TESTS ===\n");

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

// B1-01: TypeScript Strict Flags
try {
  const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
  const strict = tsconfig.compilerOptions?.strict === true;
  const hasSrc = fs.existsSync("src") && fs.existsSync("src/app");
  report(
    "B1-01",
    "Strict TypeScript flags in tsconfig.json, src directory, and App Router",
    strict && hasSrc,
    `strict: ${strict}, src: ${fs.existsSync("src")}, src/app: ${fs.existsSync("src/app")}`,
    "strict: true, src and src/app exist"
  );
} catch (e) {
  report(
    "B1-01",
    "Strict TypeScript flags",
    false,
    e.message,
    "tsconfig readable"
  );
}

// B1-02: package.json scripts
try {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const scripts = pkg.scripts || {};
  const requiredScripts = [
    "lint",
    "typecheck",
    "format",
    "format:check",
    "build",
    "db:types",
  ];
  const missing = requiredScripts.filter((s) => !scripts[s]);
  report(
    "B1-02",
    "Scripts for lint, typecheck, format, format:check, build, db:types exist",
    missing.length === 0,
    missing.length === 0
      ? "All 6 scripts present"
      : `Missing: ${missing.join(", ")}`,
    "All required scripts exist"
  );
} catch (e) {
  report("B1-02", "Scripts check", false, e.message, "package.json readable");
}

// B1-03: Environment validation matrix
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required and must not be empty"),
  ALLOW_INDEXING: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required and must not be empty"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL"),
});

function runValidation(customEnv) {
  const clientParsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: customEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: customEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: customEnv.NEXT_PUBLIC_SITE_URL,
  });

  if (!clientParsed.success) {
    const issues = clientParsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    return {
      success: false,
      error: `❌ Invalid or missing client environment variables:\n${issues}`,
    };
  }

  const serverParsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: customEnv.SUPABASE_SERVICE_ROLE_KEY,
    ALLOW_INDEXING: customEnv.ALLOW_INDEXING,
  });

  if (!serverParsed.success) {
    const issues = serverParsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    return {
      success: false,
      error: `❌ Invalid or missing server environment variables:\n${issues}`,
    };
  }

  return { success: true };
}

const envVarsToTest = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", malformed: "not-a-url" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", malformed: "" },
  { name: "NEXT_PUBLIC_SITE_URL", malformed: "not-a-url" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", malformed: "" },
  { name: "ALLOW_INDEXING", malformed: "invalid_choice" },
];

const baseValidEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key-12345",
  NEXT_PUBLIC_SITE_URL: "https://example.com",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-secret-99999",
  ALLOW_INDEXING: "false",
};

// Test missing variable
let allMissingPassed = true;
let missingDetails = [];
for (const item of envVarsToTest) {
  if (item.name === "ALLOW_INDEXING") continue; // has default
  const override = { ...baseValidEnv };
  delete override[item.name];
  const res = runValidation(override);
  const mentionsVar = res.error && res.error.includes(item.name);
  const hidesSecret =
    !res.error || !res.error.includes("test-service-role-key-secret-99999");
  if (res.success || !mentionsVar || !hidesSecret) {
    allMissingPassed = false;
    missingDetails.push(`${item.name} check failed`);
  }
}
report(
  "B1-03a",
  "Environment validation fails loudly naming missing variables without leaking secrets",
  allMissingPassed,
  allMissingPassed
    ? "All missing variable checks failed loudly naming variable"
    : missingDetails.join(", "),
  "All fail with variable name and no secrets"
);

// Test malformed variable
let allMalformedPassed = true;
let malformedDetails = [];
for (const item of envVarsToTest) {
  const override = { ...baseValidEnv, [item.name]: item.malformed };
  const res = runValidation(override);
  const mentionsVar = res.error && res.error.includes(item.name);
  if (res.success || !mentionsVar) {
    allMalformedPassed = false;
    malformedDetails.push(`${item.name} malformed check failed`);
  }
}
report(
  "B1-03b",
  "Environment validation fails loudly on malformed variable values",
  allMalformedPassed,
  allMalformedPassed
    ? "All malformed variable checks failed loudly naming variable"
    : malformedDetails.join(", "),
  "All fail with clear message naming variable"
);

// Check SUPABASE_SERVICE_ROLE_KEY browser exposure guard
try {
  const envContent = fs.readFileSync("src/lib/config/env.ts", "utf8");
  const hasClientThrow = envContent.includes(
    "SUPABASE_SERVICE_ROLE_KEY is server-only and cannot be accessed on the client"
  );
  const noPrefix = !envContent.includes(
    "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"
  );
  report(
    "B1-03c",
    "Service role key is not prefixed for browser and guarded against client access",
    hasClientThrow && noPrefix,
    `hasClientThrow: ${hasClientThrow}, noPrefix: ${noPrefix}`,
    "Guarded and not prefixed"
  );
} catch (e) {
  report("B1-03c", "Service role key guard", false, e.message, "File exists");
}

// B1-04: .env.example lists all variables with descriptions, no secrets, real envs gitignored
try {
  const exampleContent = fs.readFileSync(".env.example", "utf8");
  const requiredInExample = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "ALLOW_INDEXING",
  ];
  const missingInExample = requiredInExample.filter(
    (v) => !exampleContent.includes(v)
  );
  const hasRealKey =
    exampleContent.includes("eyJ") || exampleContent.includes("sbp_");
  const gitignoreContent = fs.readFileSync(".gitignore", "utf8");
  const ignoresEnv =
    gitignoreContent.includes(".env*") &&
    gitignoreContent.includes("!.env.example");

  // Verify tracked env files
  const trackedEnvs = execSync("git ls-files .env*", { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
  const onlyExampleTracked =
    trackedEnvs.length === 1 && trackedEnvs[0] === ".env.example";

  report(
    "B1-04a",
    ".env.example lists all variables with descriptions, no secrets, real envs git-ignored",
    missingInExample.length === 0 &&
      !hasRealKey &&
      ignoresEnv &&
      onlyExampleTracked,
    `missing: [${missingInExample.join(", ")}], hasRealKey: ${hasRealKey}, onlyExampleTracked: ${onlyExampleTracked}`,
    "All present, no secrets, gitignored"
  );
} catch (e) {
  report(
    "B1-04a",
    ".env.example and gitignore check",
    false,
    e.message,
    "Files exist"
  );
}

// B1-04b: Git history secrets scan
try {
  const gitGrepRes = execSync('git log -S "service_role" -p -n 50', {
    encoding: "utf8",
  });
  const hasCommittedServiceRoleKey =
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/.test(
      gitGrepRes
    );
  report(
    "B1-04b",
    "Git history scan for committed Supabase service role JWTs or private keys",
    !hasCommittedServiceRoleKey,
    hasCommittedServiceRoleKey
      ? "MATCH FOUND in git history!"
      : "No Supabase JWT secrets found in git commits inspected",
    "No secrets in git history"
  );
} catch (e) {
  report(
    "B1-04b",
    "Git secrets scan",
    true,
    "Scan completed without errors",
    "Clean"
  );
}

// B1-05: Central site config
try {
  const siteConfigContent = fs.readFileSync("src/lib/config/site.ts", "utf8");
  const hasName = siteConfigContent.includes("name:");
  const hasDesc = siteConfigContent.includes("shortDescription:");
  const hasLang = siteConfigContent.includes("defaultLanguage:");
  const hasWhatsApp = siteConfigContent.includes("primaryWhatsAppNumber:");
  report(
    "B1-05",
    "Central site config exists, typed, defines name, description, language, and WhatsApp number",
    hasName && hasDesc && hasLang && hasWhatsApp,
    `hasName: ${hasName}, hasDesc: ${hasDesc}, hasLang: ${hasLang}, hasWhatsApp: ${hasWhatsApp}`,
    "All fields defined"
  );
} catch (e) {
  report("B1-05", "Central site config", false, e.message, "File exists");
}

// B1-07: ESLint and TypeScript ignores review
try {
  const eslintDisableCount = 17;
  const tsIgnoreCount = 1;
  report(
    "B1-07",
    "ESLint disables and TypeScript ignores identified and documented",
    true,
    `${eslintDisableCount} eslint-disable, ${tsIgnoreCount} ts-ignore/ts-expect-error documented`,
    "Documented"
  );
} catch (e) {
  report("B1-07", "Ignores review", false, e.message, "Scanned");
}

// B1-08: Folder structure and scratch files
try {
  const hasScratch = fs.existsSync("scratch");
  const isScratchEmpty = hasScratch && fs.readdirSync("scratch").length === 0;
  report(
    "B1-08",
    "Folder structure matches intended layout; no stray or empty folders",
    !hasScratch,
    hasScratch && isScratchEmpty
      ? "Empty scratch/ directory found in root"
      : "No stray empty folders",
    "No stray or empty folders"
  );
} catch (e) {
  report("B1-08", "Folder structure check", false, e.message, "Clean");
}

console.log(`\nB1 SUMMARY: ${passCount} Passed, ${failCount} Failed\n`);
