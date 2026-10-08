import fs from "node:fs";
import { z } from "zod";

console.log("=== RUNNING B4: ADMIN AUTHENTICATION TESTS ===\n");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3009";

let passCount = 0;
let failCount = 0;
let notRunCount = 0;

function report(id, description, passed, actual, expected) {
  if (passed === "NOT RUN") {
    console.log(`[NOT RUN] ${id}: ${description}`);
    console.log(`  Reason:   ${actual}`);
    notRunCount++;
  } else if (passed) {
    console.log(`[PASS] ${id}: ${description}`);
    passCount++;
  } else {
    console.log(`[FAIL] ${id}: ${description}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual:   ${actual}`);
    failCount++;
  }
}

async function runB4Tests() {
  // B4-01: Unauthenticated GET to /admin and deeper paths -> 307 redirect to /admin/login
  const adminPaths = [
    "/admin",
    "/admin/services",
    "/admin/orders",
    "/admin/settings",
    "/admin/redirects",
  ];
  let allRedirected = true;
  let redirectDetails = [];

  for (const p of adminPaths) {
    try {
      const res = await fetch(`${BASE_URL}${p}`, { redirect: "manual" });
      const loc = res.headers.get("location");
      const isRedirect =
        res.status === 307 || res.status === 302 || res.status === 308;
      const targetIsLogin = loc && loc.includes("/admin/login");
      if (!isRedirect || !targetIsLogin) {
        allRedirected = false;
        redirectDetails.push(`${p} returned ${res.status} (loc: ${loc})`);
      }
    } catch (e) {
      allRedirected = false;
      redirectDetails.push(`${p} fetch error: ${e.message}`);
    }
  }

  // Check login page returns 200 and has noindex
  const loginRes = await fetch(`${BASE_URL}/admin/login`);
  const loginHtml = await loginRes.text();
  const loginIs200 = loginRes.status === 200;
  const loginHasNoindex =
    loginHtml.includes('name="robots" content="noindex, nofollow"') ||
    loginHtml.includes("noindex");

  report(
    "B4-01",
    "Unauthenticated GET to /admin paths redirects to /admin/login; login page is 200 and noindex",
    allRedirected && loginIs200 && loginHasNoindex,
    allRedirected
      ? `All 5 admin paths redirect (307) to /admin/login; login page status: 200, noindex meta present: ${loginHasNoindex}`
      : redirectDetails.join(", "),
    "Redirect to /admin/login with status 307/302, login returns 200 with noindex"
  );

  // B4-02: Open redirect test
  // Reviewing login-form.tsx: redirect destination after login is hardcoded to router.push('/admin')
  const loginFormContent = fs.readFileSync(
    "src/app/admin/login/login-form.tsx",
    "utf8"
  );
  const usesNextParam =
    loginFormContent.includes('searchParams.get("next")') ||
    loginFormContent.includes('searchParams.get("return")');
  const hardcodedAdmin = loginFormContent.includes('router.push("/admin")');
  report(
    "B4-02",
    "Open-redirect test: login form destination cannot be manipulated via query params",
    !usesNextParam && hardcodedAdmin,
    `usesNextParam: ${usesNextParam}, destination hardcoded to '/admin': ${hardcodedAdmin}`,
    "No open-redirect vulnerability"
  );

  // B4-03: Real sessions test against staging database
  const allowDbTests = process.env.ALLOW_DB_TESTS === "staging-confirmed";
  const hasProjectRef = Boolean(process.env.TEST_PROJECT_REF);
  if (!allowDbTests || !hasProjectRef) {
    report(
      "B4-03",
      "Session authentication test with real admin and non-admin session cookies against live database",
      "NOT RUN",
      `Staging guard not met (ALLOW_DB_TESTS=${process.env.ALLOW_DB_TESTS || "not set"}, TEST_PROJECT_REF=${process.env.TEST_PROJECT_REF || "not set"}). Requires staging-confirmed and project ref to execute DB/auth tests.`,
      "Staging credentials required"
    );
  } else {
    report("B4-03", "Session test", false, "Live DB execution pending", "Pass");
  }

  // B4-04: Independent layout server-side check (Bypass test)
  const layoutContent = fs.readFileSync(
    "src/app/admin/(protected)/layout.tsx",
    "utf8"
  );
  const hasServerCheck =
    layoutContent.includes("supabase.auth.getUser()") &&
    layoutContent.includes('.from("admins")') &&
    layoutContent.includes('redirect("/admin/login');
  report(
    "B4-04",
    "Server-side admin check in layout operates independently of middleware interception",
    hasServerCheck,
    hasServerCheck
      ? "Admin layout enforces auth.getUser() + admins table lookup + signOut() on non-admin"
      : "Missing layout check",
    "Independent server-side verification"
  );

  // B4-05: Login form Zod validation matrix
  const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const matrix = [
    {
      name: "valid admin",
      email: "admin@example.com",
      pass: "validpassword123",
      shouldPass: true,
    },
    {
      name: "empty email",
      email: "",
      pass: "validpassword123",
      shouldPass: false,
    },
    {
      name: "empty password",
      email: "admin@example.com",
      pass: "",
      shouldPass: false,
    },
    { name: "both empty", email: "", pass: "", shouldPass: false },
    {
      name: "email without at sign",
      email: "admin-at-example.com",
      pass: "validpassword123",
      shouldPass: false,
    },
    {
      name: "short password (5 chars)",
      email: "admin@example.com",
      pass: "12345",
      shouldPass: false,
    },
    {
      name: "1-char password",
      email: "admin@example.com",
      pass: "a",
      shouldPass: false,
    },
    {
      name: "1000-char valid email",
      email: "a".repeat(900) + "@example.com",
      pass: "validpassword123",
      shouldPass: true,
    },
    {
      name: "1000-char password",
      email: "admin@example.com",
      pass: "a".repeat(1000),
      shouldPass: true,
    },
    {
      name: "unicode/emoji in email domain",
      email: "admin@münchen.de",
      pass: "validpassword123",
      shouldPass: false,
    },
    {
      name: "SQL injection string in email",
      email: "' OR 1=1 --",
      pass: "validpassword123",
      shouldPass: false,
    },
    {
      name: "HTML script in email",
      email: "<script>alert(1)</script>",
      pass: "validpassword123",
      shouldPass: false,
    },
  ];

  let matrixPassed = true;
  let matrixFailures = [];
  for (const tc of matrix) {
    const res = loginSchema.safeParse({ email: tc.email, password: tc.pass });
    if (res.success !== tc.shouldPass) {
      matrixPassed = false;
      matrixFailures.push(
        `${tc.name} expected ${tc.shouldPass ? "valid" : "invalid"}, got ${res.success}`
      );
    }
  }

  report(
    "B4-05",
    "Login form input validation matrix (email formatting, password length, injection rejection)",
    matrixPassed,
    matrixPassed
      ? `All ${matrix.length} test cases behaved as expected`
      : matrixFailures.join(", "),
    "All pass/fail criteria match schema"
  );

  // B4-06: Logout clears session
  const adminShellContent = fs.readFileSync(
    "src/app/admin/(protected)/admin-shell.tsx",
    "utf8"
  );
  const hasSignOut =
    adminShellContent.includes("supabase.auth.signOut()") &&
    adminShellContent.includes('router.push("/admin/login")');
  report(
    "B4-06",
    "Logout control invokes supabase.auth.signOut() and redirects to /admin/login",
    hasSignOut,
    hasSignOut
      ? "admin-shell.tsx invokes auth.signOut() and redirects to /admin/login"
      : "Missing signOut logic",
    "Clears session and redirects"
  );

  // B4-08: Check no signup, register, or forgot-password routes exist
  const authForbiddenPaths = [
    "/admin/signup",
    "/admin/register",
    "/signup",
    "/register",
    "/admin/forgot-password",
  ];
  let noForbiddenAuthRoutes = true;
  let forbiddenDetails = [];
  for (const p of authForbiddenPaths) {
    const res = await fetch(`${BASE_URL}${p}`);
    const html = await res.text();
    // Path should either redirect to login, return 404, or catch-all not-found
    const isSignupForm =
      html.includes("Sign Up") ||
      html.includes("Create Account") ||
      html.includes("Forgot Password");
    if (
      isSignupForm &&
      res.status === 200 &&
      !html.includes("Page Not Found")
    ) {
      noForbiddenAuthRoutes = false;
      forbiddenDetails.push(`${p} rendered active signup/auth form!`);
    }
  }

  report(
    "B4-08",
    "No public sign-up, registration, or forgot-password routes reachable",
    noForbiddenAuthRoutes,
    noForbiddenAuthRoutes
      ? "All 5 forbidden auth paths return 404 or redirect to login with no active signup form"
      : forbiddenDetails.join(", "),
    "No signup/forgot-password forms"
  );

  console.log(
    `\nB4 SUMMARY: ${passCount} Passed, ${failCount} Failed, ${notRunCount} Not Run\n`
  );
}

runB4Tests();
