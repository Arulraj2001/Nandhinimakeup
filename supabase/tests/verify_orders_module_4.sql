-- ==============================================================================
-- VERIFICATION SCRIPT: Phase 4 Orders & Checkout Logic
-- File: supabase/tests/verify_orders_module_4.sql
-- ==============================================================================
-- WARNING:
-- 1. This script is for test/verification environments ONLY.
-- 2. It must NOT be applied as a migration.
-- 3. It must NEVER be run against the production database.
--
-- This script runs inside a single transaction and executes ROLLBACK at the end,
-- ensuring all test records are completely cleaned up and never persisted.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
  v_cat_id uuid;
  v_prod_sale_id uuid;
  v_prod_nosale_id uuid;
  v_prod_unpub_id uuid;
  v_prod_oos_id uuid;
  v_prod_stock_id uuid;
  v_res jsonb;
  v_order_id uuid;
  v_subtotal numeric;
  v_delivery numeric;
  v_total numeric;
  v_line_price numeric;
  v_stock_after int;
  v_status_after text;
  v_order_no text;
  v_err_occurred boolean;
  v_has_privilege boolean;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'STARTING PHASE 4 ORDERS & CHECKOUT VERIFICATION SUITE';
  RAISE NOTICE '============================================================';

  -- ----------------------------------------------------------------------------
  -- Setup: Create temporary category for testing
  -- ----------------------------------------------------------------------------
  INSERT INTO public.product_categories (name, slug, sort_order)
  VALUES ('Test Suite Category', 'test-suite-cat-' || substr(md5(random()::text), 1, 6), 999)
  RETURNING id INTO v_cat_id;

  -- ----------------------------------------------------------------------------
  -- SCENARIO 1: Price taken from database and sale price used when set
  -- ----------------------------------------------------------------------------
  -- Product A: Price 1000, Sale Price 800 -> should use 800
  INSERT INTO public.products (category_id, name, slug, price, sale_price, is_published, stock_status, stock_quantity)
  VALUES (v_cat_id, 'Test Product Sale', 'test-prod-sale-' || substr(md5(random()::text), 1, 6), 1000.00, 800.00, true, 'in_stock', 10)
  RETURNING id INTO v_prod_sale_id;

  -- Product B: Price 500, Sale Price NULL -> should use 500
  INSERT INTO public.products (category_id, name, slug, price, sale_price, is_published, stock_status, stock_quantity)
  VALUES (v_cat_id, 'Test Product Regular', 'test-prod-nosale-' || substr(md5(random()::text), 1, 6), 500.00, NULL, true, 'in_stock', 10)
  RETURNING id INTO v_prod_nosale_id;

  v_res := public.create_order(
    jsonb_build_array(
      jsonb_build_object('product_id', v_prod_sale_id, 'quantity', 2),
      jsonb_build_object('product_id', v_prod_nosale_id, 'quantity', 1)
    ),
    'Test Customer 1', '9876543210', 'test1@example.com',
    'Line 1', NULL, 'Chennai', 'Tamil Nadu', '600001',
    NULL, 50.00, 2000.00, 'ORD'
  );

  v_order_id := (v_res->>'order_id')::uuid;
  v_subtotal := (v_res->>'subtotal')::numeric;

  -- Expected subtotal: (800 * 2) + (500 * 1) = 2100.00
  IF v_subtotal = 2100.00 THEN
    RAISE NOTICE 'PASS: Scenario 1 - Sale price (800*2) and regular price (500*1) evaluated correctly to subtotal %', v_subtotal;
  ELSE
    RAISE WARNING 'FAIL: Scenario 1 - Expected subtotal 2100.00, got %', v_subtotal;
  END IF;

  -- ----------------------------------------------------------------------------
  -- SCENARIO 2: Unpublished and out-of-stock products rejected
  -- ----------------------------------------------------------------------------
  -- 2a: Unpublished product
  INSERT INTO public.products (category_id, name, slug, price, is_published, stock_status, stock_quantity)
  VALUES (v_cat_id, 'Unpublished Product', 'test-unpub-' || substr(md5(random()::text), 1, 6), 300.00, false, 'in_stock', 5)
  RETURNING id INTO v_prod_unpub_id;

  v_err_occurred := false;
  BEGIN
    PERFORM public.create_order(
      jsonb_build_array(jsonb_build_object('product_id', v_prod_unpub_id, 'quantity', 1)),
      'Test Cust', '9876543210', NULL, 'Line 1', NULL, 'Chennai', 'Tamil Nadu', '600001', NULL, 50, 1000, 'ORD'
    );
  EXCEPTION WHEN OTHERS THEN
    v_err_occurred := true;
  END;

  IF v_err_occurred THEN
    RAISE NOTICE 'PASS: Scenario 2a - Unpublished product was rejected as expected';
  ELSE
    RAISE WARNING 'FAIL: Scenario 2a - Unpublished product was NOT rejected';
  END IF;

  -- 2b: Out-of-stock product
  INSERT INTO public.products (category_id, name, slug, price, is_published, stock_status, stock_quantity)
  VALUES (v_cat_id, 'OOS Product', 'test-oos-' || substr(md5(random()::text), 1, 6), 300.00, true, 'out_of_stock', 0)
  RETURNING id INTO v_prod_oos_id;

  v_err_occurred := false;
  BEGIN
    PERFORM public.create_order(
      jsonb_build_array(jsonb_build_object('product_id', v_prod_oos_id, 'quantity', 1)),
      'Test Cust', '9876543210', NULL, 'Line 1', NULL, 'Chennai', 'Tamil Nadu', '600001', NULL, 50, 1000, 'ORD'
    );
  EXCEPTION WHEN OTHERS THEN
    v_err_occurred := true;
  END;

  IF v_err_occurred THEN
    RAISE NOTICE 'PASS: Scenario 2b - Out-of-stock product was rejected as expected';
  ELSE
    RAISE WARNING 'FAIL: Scenario 2b - Out-of-stock product was NOT rejected';
  END IF;

  -- ----------------------------------------------------------------------------
  -- SCENARIO 3: Quantity above tracked stock rejected
  -- ----------------------------------------------------------------------------
  INSERT INTO public.products (category_id, name, slug, price, is_published, stock_status, stock_quantity)
  VALUES (v_cat_id, 'Low Stock Product', 'test-low-' || substr(md5(random()::text), 1, 6), 300.00, true, 'in_stock', 2)
  RETURNING id INTO v_prod_stock_id;

  v_err_occurred := false;
  BEGIN
    -- Ordering 3 when only 2 are tracked
    PERFORM public.create_order(
      jsonb_build_array(jsonb_build_object('product_id', v_prod_stock_id, 'quantity', 3)),
      'Test Cust', '9876543210', NULL, 'Line 1', NULL, 'Chennai', 'Tamil Nadu', '600001', NULL, 50, 1000, 'ORD'
    );
  EXCEPTION WHEN OTHERS THEN
    v_err_occurred := true;
  END;

  IF v_err_occurred THEN
    RAISE NOTICE 'PASS: Scenario 3 - Order with quantity (3) exceeding stock (2) was rejected as expected';
  ELSE
    RAISE WARNING 'FAIL: Scenario 3 - Quantity exceeding tracked stock was NOT rejected';
  END IF;

  -- ----------------------------------------------------------------------------
  -- SCENARIO 4: Stock reduced on order and product set to out of stock at zero
  -- ----------------------------------------------------------------------------
  -- Order exactly 2 remaining items of v_prod_stock_id
  v_res := public.create_order(
    jsonb_build_array(jsonb_build_object('product_id', v_prod_stock_id, 'quantity', 2)),
    'Test Cust', '9876543210', NULL, 'Line 1', NULL, 'Chennai', 'Tamil Nadu', '600001', NULL, 50, 1000, 'ORD'
  );

  SELECT stock_quantity, stock_status INTO v_stock_after, v_status_after
  FROM public.products
  WHERE id = v_prod_stock_id;

  IF v_stock_after = 0 AND v_status_after = 'out_of_stock' THEN
    RAISE NOTICE 'PASS: Scenario 4 - Stock reduced to 0 and stock_status set to out_of_stock';
  ELSE
    RAISE WARNING 'FAIL: Scenario 4 - Expected stock 0 and out_of_stock, got stock % status %', v_stock_after, v_status_after;
  END IF;

  -- ----------------------------------------------------------------------------
  -- SCENARIO 5: Cancelling twice restores stock exactly once
  -- ----------------------------------------------------------------------------
  v_order_id := (v_res->>'order_id')::uuid;

  -- First cancellation: should restore 2 items to stock
  PERFORM public.cancel_order(v_order_id, 'Customer cancellation test 1');

  SELECT stock_quantity, stock_status INTO v_stock_after, v_status_after
  FROM public.products
  WHERE id = v_prod_stock_id;

  IF v_stock_after = 2 AND v_status_after = 'in_stock' THEN
    RAISE NOTICE 'PASS: Scenario 5a - First cancel restored stock to 2 and status to in_stock';
  ELSE
    RAISE WARNING 'FAIL: Scenario 5a - First cancel did not restore stock correctly: stock % status %', v_stock_after, v_status_after;
  END IF;

  -- Second cancellation: must NOT restore stock again
  v_res := public.cancel_order(v_order_id, 'Duplicate cancellation attempt');

  SELECT stock_quantity INTO v_stock_after
  FROM public.products
  WHERE id = v_prod_stock_id;

  IF v_stock_after = 2 AND (v_res->>'already_cancelled')::boolean = true THEN
    RAISE NOTICE 'PASS: Scenario 5b - Second cancel was idempotent: stock remained 2 (not restored twice)';
  ELSE
    RAISE WARNING 'FAIL: Scenario 5b - Second cancel failed idempotency check: stock is %', v_stock_after;
  END IF;

  -- ----------------------------------------------------------------------------
  -- SCENARIO 6: Delivery charge zero at the free-delivery threshold
  -- ----------------------------------------------------------------------------
  -- 6a: Under threshold (subtotal = 500, threshold = 1000, flat = 70)
  v_res := public.create_order(
    jsonb_build_array(jsonb_build_object('product_id', v_prod_nosale_id, 'quantity', 1)),
    'Test Cust', '9876543210', NULL, 'Line 1', NULL, 'Chennai', 'Tamil Nadu', '600001', NULL, 70.00, 1000.00, 'ORD'
  );
  v_delivery := (v_res->>'delivery_charge')::numeric;
  v_total := (v_res->>'total')::numeric;

  IF v_delivery = 70.00 AND v_total = 570.00 THEN
    RAISE NOTICE 'PASS: Scenario 6a - Below threshold delivery charge 70.00 applied correctly (total 570.00)';
  ELSE
    RAISE WARNING 'FAIL: Scenario 6a - Expected delivery 70.00 and total 570.00, got delivery % total %', v_delivery, v_total;
  END IF;

  -- 6b: At/Above threshold (subtotal = 1000, threshold = 1000, flat = 70)
  v_res := public.create_order(
    jsonb_build_array(jsonb_build_object('product_id', v_prod_nosale_id, 'quantity', 2)),
    'Test Cust', '9876543210', NULL, 'Line 1', NULL, 'Chennai', 'Tamil Nadu', '600001', NULL, 70.00, 1000.00, 'ORD'
  );
  v_delivery := (v_res->>'delivery_charge')::numeric;
  v_total := (v_res->>'total')::numeric;

  IF v_delivery = 0.00 AND v_total = 1000.00 THEN
    RAISE NOTICE 'PASS: Scenario 6b - At free-delivery threshold delivery charge is 0.00 (total 1000.00)';
  ELSE
    RAISE WARNING 'FAIL: Scenario 6b - Expected delivery 0.00 and total 1000.00, got delivery % total %', v_delivery, v_total;
  END IF;

  -- ----------------------------------------------------------------------------
  -- SCENARIO 7: Order number prefix and sequence format
  -- ----------------------------------------------------------------------------
  -- 7a: Custom valid prefix 'NM'
  v_res := public.create_order(
    jsonb_build_array(jsonb_build_object('product_id', v_prod_nosale_id, 'quantity', 1)),
    'Test Cust', '9876543210', NULL, 'Line 1', NULL, 'Chennai', 'Tamil Nadu', '600001', NULL, 0, 0, 'NM'
  );
  v_order_no := v_res->>'order_number';

  IF v_order_no ~ '^NM[0-9]{4,}$' THEN
    RAISE NOTICE 'PASS: Scenario 7a - Custom prefix formatted correctly: %', v_order_no;
  ELSE
    RAISE WARNING 'FAIL: Scenario 7a - Invalid order number format: %', v_order_no;
  END IF;

  -- 7b: Invalid prefix fallback to 'ORD'
  v_res := public.create_order(
    jsonb_build_array(jsonb_build_object('product_id', v_prod_nosale_id, 'quantity', 1)),
    'Test Cust', '9876543210', NULL, 'Line 1', NULL, 'Chennai', 'Tamil Nadu', '600001', NULL, 0, 0, 'bad#prefix!'
  );
  v_order_no := v_res->>'order_number';

  IF v_order_no ~ '^ORD[0-9]{4,}$' THEN
    RAISE NOTICE 'PASS: Scenario 7b - Invalid prefix fallback to ORD: %', v_order_no;
  ELSE
    RAISE WARNING 'FAIL: Scenario 7b - Prefix fallback failed: %', v_order_no;
  END IF;

  -- ----------------------------------------------------------------------------
  -- SCENARIO 8: Anonymous role cannot select, insert or execute order functions
  -- ----------------------------------------------------------------------------
  -- Check table select privilege for anon
  SELECT has_table_privilege('anon', 'public.orders', 'select') INTO v_has_privilege;
  IF NOT v_has_privilege THEN
    RAISE NOTICE 'PASS: Scenario 8a - anon role CANNOT select from orders';
  ELSE
    RAISE WARNING 'FAIL: Scenario 8a - anon role has SELECT on orders!';
  END IF;

  -- Check table insert privilege for anon
  SELECT has_table_privilege('anon', 'public.orders', 'insert') INTO v_has_privilege;
  IF NOT v_has_privilege THEN
    RAISE NOTICE 'PASS: Scenario 8b - anon role CANNOT insert into orders';
  ELSE
    RAISE WARNING 'FAIL: Scenario 8b - anon role has INSERT on orders!';
  END IF;

  -- Check function execute privilege on create_order for anon
  SELECT has_function_privilege('anon', 'public.create_order(jsonb, text, text, text, text, text, text, text, text, text, numeric, numeric, text)', 'execute')
  INTO v_has_privilege;
  IF NOT v_has_privilege THEN
    RAISE NOTICE 'PASS: Scenario 8c - anon role CANNOT execute create_order';
  ELSE
    RAISE WARNING 'FAIL: Scenario 8c - anon role has EXECUTE on create_order!';
  END IF;

  -- Check function execute privilege on cancel_order for anon
  SELECT has_function_privilege('anon', 'public.cancel_order(uuid, text)', 'execute')
  INTO v_has_privilege;
  IF NOT v_has_privilege THEN
    RAISE NOTICE 'PASS: Scenario 8d - anon role CANNOT execute cancel_order';
  ELSE
    RAISE WARNING 'FAIL: Scenario 8d - anon role has EXECUTE on cancel_order!';
  END IF;

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'ALL SCENARIOS COMPLETED';
  RAISE NOTICE '============================================================';

END $$;

-- Rollback unconditionally so no test data remains in the database
ROLLBACK;


-- ==============================================================================
-- MANUAL CONCURRENCY VERIFICATION PROCEDURE
-- (Two database sessions racing for the last piece in Supabase SQL Editor)
-- ==============================================================================
/*
PURPOSE:
Verify that row-level locking (SELECT ... FOR UPDATE) in public.create_order
strictly serializes concurrent order attempts on the same inventory, allowing
exactly one session to succeed and blocking the second session with an out-of-stock
error when stock_quantity reaches 0.

PREREQUISITES:
- Supabase Dashboard > SQL Editor opened in TWO separate browser tabs (Session 1 & Session 2).
- An active test product with stock_quantity = 1 and stock_status = 'in_stock'.

SETUP SCRIPT (Run in Tab 1 once):
--------------------------------------------------------------------------------
INSERT INTO public.products (name, slug, price, is_published, stock_status, stock_quantity)
VALUES ('Race Test Item', 'race-test-item', 100.00, true, 'in_stock', 1)
RETURNING id;
-- Note the returned product UUID: e.g., '11111111-2222-3333-4444-555555555555'

EXECUTION PROCEDURE:
--------------------------------------------------------------------------------
Step 1: In Tab 1, prepare an explicit transaction block that locks the product
        via create_order but does NOT commit yet:

        BEGIN;
        SELECT public.create_order(
          jsonb_build_array(jsonb_build_object('product_id', 'YOUR-PRODUCT-UUID'::uuid, 'quantity', 1)),
          'Racer 1', '9876543210', NULL, 'Address 1', NULL, 'City', 'State', '600001', NULL, 0, 0, 'ORD'
        );
        -- DO NOT RUN COMMIT YET!

Step 2: In Tab 2, run a concurrent order for the same product:

        SELECT public.create_order(
          jsonb_build_array(jsonb_build_object('product_id', 'YOUR-PRODUCT-UUID'::uuid, 'quantity', 1)),
          'Racer 2', '9876543211', NULL, 'Address 2', NULL, 'City', 'State', '600001', NULL, 0, 0, 'ORD'
        );

Step 3: Observe Tab 2:
        Tab 2 blocks / hangs in 'Running query...' because Tab 1 holds an exclusive
        FOR UPDATE lock on the product row.

Step 4: Return to Tab 1 and execute:

        COMMIT;

Step 5: Observe the result in Tab 2:
        As soon as Tab 1 commits, Tab 2 wakes up, re-evaluates the newly committed
        row state (stock_quantity = 0, stock_status = 'out_of_stock'), and throws:
        ERROR: Product "Race Test Item" is out of stock (or only has 0 item(s) left in stock).

CLEANUP SCRIPT (Run in Tab 1):
--------------------------------------------------------------------------------
DELETE FROM public.products WHERE slug = 'race-test-item';
DELETE FROM public.orders WHERE customer_name IN ('Racer 1', 'Racer 2');
--------------------------------------------------------------------------------
EXPECTED RESULT:
- Session 1: Order created successfully, returns order_number, stock reduced to 0.
- Session 2: Raises exception, 0 orders created, transaction aborted cleanly.
- No race condition or negative stock is physically possible.
*/
