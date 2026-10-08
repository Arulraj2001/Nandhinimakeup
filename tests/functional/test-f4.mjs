import fs from "node:fs";
import {
  BASE_URL,
  adminClient,
  saveResult,
} from "./common.mjs";
import { timingSafeEqualStr } from "../../src/lib/utils/crypto.ts";
import { buildUpiPayUrl } from "../../src/lib/utils/upi.ts";

console.log("=== RUNNING F4: SHOP LOGIC AUDIT ===");

const f4Results = {};

const ACTIONS = {
  lookupCartProducts: "406ae01d50d8e55e3a16846855cc321afa93d722b5",
  submitCheckout: "403151a278b60f92ffb73be44f5675cb9bea4330e8",
};

async function invokePublicAction(actionId, args = [], route = "/cart") {
  const res = await fetch(`${BASE_URL}${route}`, {
    method: "POST",
    headers: {
      "Next-Action": actionId,
      "Content-Type": "text/plain;charset=UTF-8",
      "Accept": "text/x-component",
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  const match = text.split("\n").find((l) => l.startsWith("1:"));
  if (match) {
    try {
      return JSON.parse(match.slice(2));
    } catch {
      return { raw: text };
    }
  }
  return { status: res.status, raw: text };
}

async function runF4() {
  // 1. Cart Lookup: current data for published products only, hostile input safe
  console.log("\n--- F4-01: Cart Lookup Action ---");
  const cartChecks = {};

  // Hostile inputs
  const hostileCartInputs = [
    [],
    ["' OR 1=1 --", "<script>alert(1)</script>"],
    ["00000000-0000-0000-0000-000000000000"],
    ["not-a-uuid"],
  ];
  let hostileSafe = true;
  for (const inp of hostileCartInputs) {
    try {
      const res = await invokePublicAction(ACTIONS.lookupCartProducts, [inp]);
      // Should return empty array safely without crash
      if (!Array.isArray(res)) hostileSafe = false;
    } catch {
      hostileSafe = false;
    }
  }
  cartChecks.hostileInputSafe = { pass: hostileSafe };
  console.log(`  Cart lookup hostile input safety: ${hostileSafe ? "PASS" : "FAIL"}`);

  f4Results.f4_01_cart_lookup = {
    status: hostileSafe ? "WORKS" : "BROKEN",
    checks: cartChecks,
  };

  // 2. Checkout Validation over HTTP as Anonymous
  console.log("\n--- F4-02: Checkout Validation over HTTP ---");
  const checkoutValChecks = {};

  const baseValidCheckout = {
    customer_name: "zz_test_Customer",
    phone: "9000000001",
    email: "customer@example.invalid",
    address_line_1: "123 Test Street",
    address_line_2: "",
    city: "Chennai",
    state: "Tamil Nadu",
    pin_code: "600001",
    customer_note: "Please deliver carefully",
    honeypot: "",
    items: [
      {
        productId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        quantity: 1,
      },
    ],
  };

  // Test 1: Honeypot rejection
  const honeypotRes = await invokePublicAction(ACTIONS.submitCheckout, [
    { ...baseValidCheckout, honeypot: "spam_bot_input" },
  ], "/checkout");
  const honeypotBlocked = !honeypotRes?.success && honeypotRes?.error === "Invalid submission.";
  checkoutValChecks.honeypotBlocked = { pass: honeypotBlocked, res: honeypotRes };
  console.log(`  Honeypot rejection: ${honeypotBlocked ? "PASS" : "FAIL"}`);

  // Test 2: Invalid Indian phone formats
  const invalidPhones = ["12345", "0000000000", "98765", "abcdefghij"];
  let badPhonesRejected = true;
  for (const ph of invalidPhones) {
    const res = await invokePublicAction(ACTIONS.submitCheckout, [
      { ...baseValidCheckout, phone: ph },
    ], "/checkout");
    if (res?.success) badPhonesRejected = false;
  }
  checkoutValChecks.invalidPhonesRejected = { pass: badPhonesRejected };
  console.log(`  Invalid phone numbers rejected: ${badPhonesRejected ? "PASS" : "FAIL"}`);

  // Test 3: Invalid PIN codes (must be 6 digits)
  const invalidPins = ["123", "12345", "60000A", "1234567"];
  let badPinsRejected = true;
  for (const pin of invalidPins) {
    const res = await invokePublicAction(ACTIONS.submitCheckout, [
      { ...baseValidCheckout, pin_code: pin },
    ], "/checkout");
    if (res?.success) badPinsRejected = false;
  }
  checkoutValChecks.invalidPinsRejected = { pass: badPinsRejected };
  console.log(`  Invalid PIN codes rejected: ${badPinsRejected ? "PASS" : "FAIL"}`);

  // Test 4: Quantity limits (0, negative, >10, decimal)
  const invalidQuantities = [0, -1, 11, 2.5];
  let badQuantitiesRejected = true;
  for (const q of invalidQuantities) {
    const res = await invokePublicAction(ACTIONS.submitCheckout, [
      {
        ...baseValidCheckout,
        items: [{ productId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", quantity: q }],
      },
    ], "/checkout");
    if (res?.success) badQuantitiesRejected = false;
  }
  checkoutValChecks.invalidQuantitiesRejected = { pass: badQuantitiesRejected };
  console.log(`  Quantity limits (0, -1, 11, 2.5) rejected: ${badQuantitiesRejected ? "PASS" : "FAIL"}`);

  // Test 5: Execution against remote database (checks create_order RPC)
  const execRes = await invokePublicAction(ACTIONS.submitCheckout, [
    baseValidCheckout,
  ], "/checkout");
  const rpcMissing = !execRes?.success && (execRes?.error?.includes("create_order") || execRes?.error?.includes("PGRST202"));
  checkoutValChecks.createOrderExecution = {
    pass: !rpcMissing,
    error: execRes?.error,
    reason: rpcMissing
      ? "create_order RPC function missing from remote database (migration 20261007070000_orders.sql not applied)"
      : "Function executed",
  };
  console.log(`  create_order RPC database execution: ${rpcMissing ? "BROKEN (missing from remote DB)" : "WORKS"}`);

  f4Results.f4_02_checkout_validation = {
    status: honeypotBlocked && badPhonesRejected && badPinsRejected && badQuantitiesRejected
      ? (rpcMissing ? "BROKEN" : "WORKS")
      : "BROKEN",
    checks: checkoutValChecks,
  };

  // 3. Database RPC & Stock Concurrency Check
  console.log("\n--- F4-03: Stock & Database Functions Audit ---");
  const { error: rpcCheckErr } = await adminClient.rpc("create_order", {
    p_items: [],
    p_customer_name: "zz_test",
    p_phone: "+919000000001",
    p_address_line_1: "test",
    p_city: "Chennai",
    p_state: "Tamil Nadu",
    p_pin_code: "600001",
    p_flat_delivery_charge: 50,
    p_free_delivery_threshold: 500,
    p_order_number_prefix: "TST",
  });
  const dbFunctionsMissing = Boolean(rpcCheckErr && rpcCheckErr.code === "PGRST202");
  f4Results.f4_03_stock_and_concurrency = {
    status: dbFunctionsMissing ? "BROKEN" : "WORKS",
    reason: dbFunctionsMissing
      ? `Database function public.create_order does not exist (${rpcCheckErr.message}). Concurrency and stock tests cannot run against real database until migration 20261007070000_orders.sql is applied.`
      : "Database functions available",
  };

  // 4. UPI Payment Link & QR Generator Unit Logic Check
  console.log("\n--- F4-04: UPI Payment & QR Generator Audit ---");
  const upiChecks = {};
  
  // Valid UPI link generation
  const upiLink = buildUpiPayUrl({
    upiId: "nandhini@upi",
    payeeName: "Nandhini Makeup",
    amount: 1500.5,
    orderNumber: "TST-1001",
  });
  const upiPass = upiLink.includes("pa=nandhini") && upiLink.includes("am=1500.50") && upiLink.includes("cu=INR") && upiLink.includes("tn=TST-1001");
  upiChecks.upiLinkParams = { pass: upiPass, generated: upiLink };
  console.log(`  UPI payment link generation: ${upiPass ? "PASS" : "FAIL"} (${upiLink})`);

  // Zero total: buildUpiPayUrl currently generates am=0.00
  const zeroUpiLink = buildUpiPayUrl({
    upiId: "nandhini@upi",
    payeeName: "Nandhini Makeup",
    amount: 0,
    orderNumber: "TST-1002",
  });
  const zeroPass = zeroUpiLink === "";
  upiChecks.zeroAmountNoPayableUpi = { pass: zeroPass, generated: zeroUpiLink, note: "buildUpiPayUrl formats 0 as 0.00 without suppressing payable link for 0 total" };
  console.log(`  Zero total payable QR/link suppressed: ${zeroPass ? "PASS" : "FAIL (Generated link: " + zeroUpiLink + ")"}`);

  // Hostile UPI payee name parameter injection attempt: "Nandhini&am=1.00"
  const hostileUpi = buildUpiPayUrl({
    upiId: "nandhini@upi",
    payeeName: "Nandhini&am=0.01",
    amount: 500,
    orderNumber: "TST-1003",
  });
  // URL encoding should prevent injection of additional parameters
  const injectionPrevented = !hostileUpi.includes("&am=0.01&");
  upiChecks.hostileInjectionPrevented = { pass: injectionPrevented, generated: hostileUpi };
  console.log(`  Hostile parameter injection prevented: ${injectionPrevented ? "PASS" : "FAIL"}`);

  f4Results.f4_04_payment_upi = {
    status: upiPass && zeroPass && injectionPrevented ? "WORKS" : "BROKEN",
    checks: upiChecks,
  };

  // 5. Order Page Security & Token Comparison
  console.log("\n--- F4-05: Order Page Security & Token Comparison ---");
  const tokenChecks = {};

  // Timing safe token comparison test
  const tokenA = "3a9f0e1c2b3d4e5f6a7b8c9d0e1f2a3b";
  const tokenB = "3a9f0e1c2b3d4e5f6a7b8c9d0e1f2a3b";
  const tokenC = "wrong_token_value_3a9f0e1c2b3d4e5f";
  const timingMatch = timingSafeEqualStr(tokenA, tokenB);
  const timingMismatch = !timingSafeEqualStr(tokenA, tokenC);
  const timingEmpty = !timingSafeEqualStr(tokenA, "");
  tokenChecks.timingSafeEqual = {
    pass: timingMatch && timingMismatch && timingEmpty,
  };
  console.log(`  Timing-safe token equality check: ${tokenChecks.timingSafeEqual.pass ? "PASS" : "FAIL"}`);

  f4Results.f4_05_order_security = {
    status: tokenChecks.timingSafeEqual.pass ? "WORKS" : "BROKEN",
    checks: tokenChecks,
  };

  saveResult("f4-shop-logic.json", f4Results);
  console.log("\nF4 tests completed! Evidence written to tests/functional/results/f4-shop-logic.json\n");
}

runF4().catch((err) => {
  console.error("F4 run failed:", err);
  process.exit(1);
});
