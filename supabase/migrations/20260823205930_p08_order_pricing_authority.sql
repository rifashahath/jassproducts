-- =====================================================================
-- P0-8 / H-4 : Make the order-recording function authoritative about money
-- =====================================================================
-- Replaces public.process_order_atomic. Every change below was measured by executing the
-- current function (supabase/production_remediation_migration.sql:527-723) against a
-- local throwaway PostgreSQL 17 cluster with the real table definitions. No production
-- database was touched and no payment was made.
--
-- ---------------------------------------------------------------------
-- D1  Caller-supplied money written verbatim; the authoritative figure discarded.
-- ---------------------------------------------------------------------
-- The function computed `v_computed_subtotal` from the catalogue price of each locked
-- product row -- and then never read the variable. It inserted p_subtotal, p_shipping_cost,
-- p_discount, p_gst and p_total into public.orders exactly as received.
--
-- MEASURED: vase-01 priced at 2400 in public.products. Called as a plain signed-in
-- customer with p_subtotal=1, p_gst=0, p_total=1, it returned
--   {"total": 1, "status": "PROCESSING", "success": true, "order_id": "FORGED-001"}
-- and recorded subtotal=1, gst=0, total=1, total_amount=1, status='PROCESSING'. Stock went
-- 10 -> 9 and an inventory_logs SALE row was written. The correct total was 3331
-- (2400 subtotal + 499 shipping + 432 GST).
--
-- ---------------------------------------------------------------------
-- D2  Reachable directly by any authenticated user, with no payment check.
-- ---------------------------------------------------------------------
-- The function is SECURITY DEFINER (so it bypasses RLS) and was
-- GRANT EXECUTE ... TO authenticated. Supabase exposes every public-schema function at
-- POST /rest/v1/rpc/<name>, and the anon key needed to reach it ships in the client
-- bundle. There is no p_payment_id parameter and no signature verification anywhere in
-- the body, so nothing in it establishes that a payment occurred. p_payment_method is a
-- free-text caller value, so a forged order is indistinguishable from a real one in the
-- admin list. The run above was performed as role=authenticated with a non-admin JWT.
--
-- ---------------------------------------------------------------------
-- D3  payment_id was never written, so idempotency did not cover this path.
-- ---------------------------------------------------------------------
-- The INSERT column list omitted payment_id, order_id and razorpay_signature.
-- api/verify-razorpay-payment.ts keys its idempotency lookup on
-- `orders.payment_id = razorpay_payment_id`, and the P0-4 backstop index
-- (supabase/p04_payment_idempotency_backstop.sql) is a UNIQUE index on that same column
-- with `WHERE payment_id IS NOT NULL AND payment_id <> ''`.
--
-- MEASURED: after the run above,
--   SELECT count(*) FROM orders WHERE payment_id = 'pay_NEVER_HAPPENED';  ->  0
-- Both the application check and the index are therefore inert on the primary path. The
-- function's own idempotency check keys on p_order_id, which P0-5 made a freshly generated
-- reference per request, so a replayed payment produces a second order under a new
-- reference: duplicate fulfilment, a second stock deduction, and another coupon
-- increment. Reachable by resubmitting the same signed payload -- a retry or a
-- double-submit does it accidentally.
--
-- ---------------------------------------------------------------------
-- D4  Authorization predicate skipped in two ways.
-- ---------------------------------------------------------------------
--   IF auth.role() != 'service_role' AND auth.uid() IS NOT NULL THEN
--     IF p_user_id IS NOT NULL AND p_user_id != auth.uid() AND NOT public.is_admin() THEN
--
-- (a) p_user_id IS NOT NULL: passing p_user_id => NULL skips the check.
--     MEASURED: as customer A, p_user_id => NULL recorded order FORGED-002 with
--     user_id NULL -- the unowned class that P0-6 had to defend separately.
-- (b) auth.role() is NULL outside a PostgREST request. `NULL != 'service_role'` is NULL
--     and an SQL IF does not fire on NULL, so the entire block is skipped -- fail-open,
--     the same shape as the P0-6 defect.
--     MEASURED: with no JWT claims set, an order was created for user
--     22222222-2222-2222-2222-222222222222 by a caller who was not that user, total 1.
--     Reachability: not a normal PostgREST request, which always sets a role. It fires in
--     contexts where no request claims exist -- a trigger, a scheduled job, another
--     SECURITY DEFINER function, or a direct psql session.
--
-- The control case works and is preserved: spoofing a non-NULL other user_id was refused
-- with 'Access Denied: Cannot create order for another user ID'.
--
-- ---------------------------------------------------------------------
-- D5  Coupon states the application tolerates raised here, losing paid orders.
-- ---------------------------------------------------------------------
-- src/lib/pricing-calculator.ts ignores a coupon it cannot apply: the discount is 0 and
-- the order proceeds. This function RAISEd instead. The handler passes the raw request
-- code (`p_coupon_code: couponCode || null`), not the validated one, so the two met.
--
-- MEASURED, with the three codes passed exactly as the handler passes them:
--   EXPIRED10 -> RAISED, order lost: Coupon "EXPIRED10" has expired
--   PAUSED10  -> RAISED, order lost: Coupon "PAUSED10" is inactive
--   MAXED10   -> RAISED, order lost: Coupon "MAXED10" usage limit reached
--
-- api/verify-razorpay-payment.ts:519 turns any RPC error that is not a missing-function
-- error into `409` and returns without recording the order -- and by then the signature
-- has been verified and the money captured. So an admin pausing a coupon, or a coupon
-- expiring, while a customer is on the payment sheet destroyed that order. No attacker
-- needed.
--
-- This is why nothing on the money path below RAISEs. The rule adopted here: raise only
-- when the row cannot be written correctly at all (product missing, insufficient stock --
-- both pre-validated by the handler, so unreachable from it), and otherwise record the
-- order and report the problem. Losing a captured payment is worse than recording an
-- order that needs a correction.
--
-- ---------------------------------------------------------------------
-- Deliberate divergences, stated
-- ---------------------------------------------------------------------
-- * used_count is NOT consulted when deriving the discount, matching
--   calculateOrderPricing, which does not look at it either. Verified: neither
--   api/create-razorpay-order.ts nor api/verify-razorpay-payment.ts checks it, so the
--   amount actually charged already ignores it. Raising here did not prevent the discount
--   -- it only destroyed the order after the discounted amount had been taken. The counter
--   is still incremented, and exceeding the limit is reported. Enforcing the coupon budget
--   belongs where the coupon is offered and the charge is computed; that gap is a separate
--   finding and is not fixed here.
-- * Shipping is derived for the standard tier. calculateOrderPricing defaults to
--   "standard" and this endpoint never passes a method, so express is not reachable from
--   it. Adding an express option to checkout requires a parameter here.
--
-- ---------------------------------------------------------------------
-- Schema drift found while writing this, NOT fixed here
-- ---------------------------------------------------------------------
-- public.coupons.max_discount_cap is defined by no migration in this repository, yet:
--   * src/components/admin/coupons/coupon-form-modal.tsx collects it, defaulting to 2000;
--   * src/lib/pricing-calculator.ts:98 caps percentage discounts with it;
--   * api/create-razorpay-order.ts:202 and api/verify-razorpay-payment.ts:405 both read
--     coupon row column max_discount_cap and pass it into that calculator;
--   * src/features/admin/coupons/store/admin-coupons-store.ts:117-129 -- the only writer
--     -- omits it from the upsert payload entirely.
-- So an admin who sets a cap of 2000 on a 50% coupon gets no cap at all: the value is
-- never persisted and the column it would be persisted into does not exist. On a large
-- cart the discount is unbounded. That is a live revenue exposure, but fixing it changes
-- what customers are charged, so it is reported as a separate finding rather than altered
-- inside a payment-capture path. This function is written to behave the same whether the
-- column exists or not -- see the declaration of v_coupon.
--
-- ---------------------------------------------------------------------
-- NOT VERIFIED
-- ---------------------------------------------------------------------
-- Which grants are actually deployed. Three migration files in this repository disagree
-- about other objects, and production_master_migration.sql does not define this function
-- at all. STEP 1 is read-only -- run it and read the output before STEP 2.
--
-- SAFE TO RE-RUN.
-- =====================================================================


-- ---------------------------------------------------------------------
-- STEP 1 - READ ONLY. Run this alone first.
-- ---------------------------------------------------------------------

-- 1a. Which overloads exist, and who may execute them?
SELECT
  p.oid::regprocedure                        AS signature,
  p.prosecdef                                AS is_security_definer,
  COALESCE(
    (SELECT string_agg(DISTINCT g.grantee, ', ' ORDER BY g.grantee)
     FROM information_schema.routine_privileges g
     WHERE g.specific_schema = 'public'
       AND g.routine_name = p.proname
       AND g.privilege_type = 'EXECUTE'),
    '(none)'
  ) AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'process_order_atomic';

-- 1b. How many recorded orders are missing the payment id that idempotency keys on?
--     Every row counted here was written by the RPC path and is invisible to both the
--     application idempotency check and the P0-4 unique index.
SELECT
  count(*)                                                              AS orders_total,
  count(*) FILTER (WHERE payment_id IS NULL OR payment_id = '')          AS missing_payment_id,
  count(*) FILTER (WHERE (payment_id IS NULL OR payment_id = '')
                     AND payment_method ILIKE 'RAZORPAY%')              AS razorpay_missing_payment_id
FROM public.orders;

-- 1c. Orders whose recorded total does not match their own recorded components.
--     A row failing this arithmetic was not produced by calculateOrderPricing.
SELECT id, created_at, subtotal, discount, shipping_cost, gst, total,
       (GREATEST(subtotal - discount, 0) + shipping_cost + gst) AS implied_total
FROM public.orders
WHERE total <> (GREATEST(subtotal - discount, 0) + shipping_cost + gst)
ORDER BY created_at DESC
LIMIT 50;


-- ---------------------------------------------------------------------
-- STEP 2 - Replace the function.
-- ---------------------------------------------------------------------
-- The old 13-argument signature is dropped rather than left in place. Adding parameters
-- creates a second overload, and PostgREST cannot choose between two candidates that both
-- accept the same 13 named arguments -- it fails the request with "Could not choose the
-- best candidate function". Dropping first is what keeps the endpoint resolvable.
--
-- Deployment order does not matter. If the new SQL lands before the new handler, the old
-- handler's 13-argument call no longer resolves and PostgREST replies with a
-- schema-cache/missing-function error, which api/verify-razorpay-payment.ts routes to its
-- own transactional fallback -- and that fallback already writes payment_id and uses the
-- server-derived pricing. If the handler lands first, the extra arguments do not resolve
-- against the old function and the same fallback runs. Neither order loses an order.

BEGIN;

DROP FUNCTION IF EXISTS public.process_order_atomic(
  TEXT, UUID, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB, TEXT
);

-- The new signature too, so a second run of this file is a clean replace rather than
-- "function already exists with same argument types". Measured: without this, re-running
-- STEP 2 aborts. Both drops and the CREATE are in one transaction, so PostgREST never
-- observes a moment with no function.
DROP FUNCTION IF EXISTS public.process_order_atomic(
  TEXT, UUID, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB,
  TEXT, TEXT, TEXT, TEXT
);

CREATE FUNCTION public.process_order_atomic(
  p_order_id TEXT,
  p_user_id UUID,
  p_user_email TEXT,
  p_user_phone TEXT,
  p_items JSONB,
  p_subtotal NUMERIC,
  p_shipping_cost NUMERIC,
  p_discount NUMERIC,
  p_gst NUMERIC,
  p_total NUMERIC,
  p_payment_method TEXT,
  p_shipping_address JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  -- New. The gateway identifiers the caller already holds. p_payment_id is what the
  -- application idempotency check and the P0-4 unique index key on; without it written,
  -- neither covers this path (D3).
  p_payment_id TEXT DEFAULT NULL,
  p_razorpay_order_id TEXT DEFAULT NULL,
  p_razorpay_signature TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_item RECORD;
  v_product RECORD;
  v_product_id TEXT;
  v_qty INTEGER;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_customer_name TEXT;
  v_existing RECORD;

  -- The coupon row is read as JSONB, not into a RECORD, and every field is taken with
  -- `->>`. Reason, measured: no migration in this repository defines
  -- public.coupons.max_discount_cap, but src/lib/pricing-calculator.ts:98 reads it and the
  -- admin coupon form collects it -- so it may or may not exist in a given deployment.
  -- Referencing a missing field on a RECORD raises at runtime; an earlier revision of this
  -- function did exactly that and the probe reported
  --   MAXED10 -> RAISED, ORDER LOST: record "v_coupon" has no field "max_discount_cap"
  -- on the one path a legitimate percentage-discounted order takes. `->>` on an absent key
  -- returns NULL instead, which is how the TypeScript already treats `undefined`, so this
  -- function behaves identically whether or not the column is present and needs no schema
  -- change to be safe.
  v_coupon JSONB;
  v_coupon_id TEXT;
  v_coupon_code TEXT;
  v_coupon_status TEXT;
  v_coupon_expiry TIMESTAMPTZ;
  v_coupon_min NUMERIC;
  v_coupon_type TEXT;
  v_coupon_value NUMERIC;
  v_coupon_cap NUMERIC;
  v_coupon_limit INTEGER;
  v_coupon_used INTEGER;

  -- Mirrors DEFAULT_PRICING_CONFIG in src/lib/pricing-calculator.ts. Any change there
  -- must be made here too; the differences are reported, not silently absorbed.
  c_standard_shipping CONSTANT NUMERIC := 499;
  c_free_ship_threshold CONSTANT NUMERIC := 5000;
  c_gst_rate CONSTANT NUMERIC := 0.18;

  -- Derived in this function from the locked catalogue and coupon rows. These are the
  -- values written to public.orders.
  v_raw_subtotal NUMERIC := 0;
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_taxable NUMERIC := 0;
  v_shipping NUMERIC := 0;
  v_gst NUMERIC := 0;
  v_total NUMERIC := 0;
  v_coupon_applied BOOLEAN := false;

  v_notes JSONB := '[]'::JSONB;
  v_supplied JSONB;
  v_derived JSONB;
  v_mismatch BOOLEAN := false;
BEGIN
  -- 1. Idempotency.
  --
  -- Two keys, because they answer different questions. p_order_id catches a retry of this
  -- exact call. p_payment_id catches the case that actually happens: the same captured
  -- payment submitted twice, which under P0-5 arrives carrying a freshly generated order
  -- reference and so does not collide on id. Before this, that produced a second order.
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'message', 'Order already processed (idempotent response)'
    );
  END IF;

  IF p_payment_id IS NOT NULL AND trim(p_payment_id) <> '' THEN
    SELECT id, total, status INTO v_existing
    FROM public.orders
    WHERE payment_id = trim(p_payment_id)
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND THEN
      -- Return the order that already exists for this payment, not the reference the
      -- caller just generated, so the caller converges on one order rather than believing
      -- a second one was created.
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_existing.id,
        'total', v_existing.total,
        'status', v_existing.status,
        'message', 'Payment already processed (idempotent response)'
      );
    END IF;
  END IF;

  -- 2. Validate items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- 3. Authorization.
  --
  -- COALESCE because auth.role() is NULL outside a PostgREST request, and
  -- `NULL != 'service_role'` is NULL, which an SQL IF does not act on -- the original
  -- guard was skipped entirely in that context (D4b).
  --
  -- The `p_user_id IS NOT NULL` conjunct is gone: it let a caller create an unattributed
  -- order by passing NULL (D4a). A non-service_role caller must now name themselves
  -- exactly. Guest checkout is unaffected -- it reaches this function through
  -- api/verify-razorpay-payment.ts on the service key, so this block is skipped and
  -- p_user_id => NULL is still accepted there.
  IF COALESCE(auth.role(), '') != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Access Denied: Authentication required to create an order';
    END IF;

    IF NOT public.is_admin() THEN
      IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access Denied: Cannot create order for another user ID';
      END IF;
    END IF;
  END IF;

  -- 4. Lock and deduct stock in deterministic id order (deadlock prevention), and sum the
  --    authoritative subtotal from the catalogue price of each locked row.
  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(p_items) AS (
      id TEXT,
      qty INTEGER,
      name TEXT,
      price NUMERIC,
      image TEXT
    ) ORDER BY id
  LOOP
    v_product_id := v_item.id;
    v_qty := v_item.qty;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Item % has invalid quantity: %', v_product_id, v_qty;
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID "%" does not exist in catalog', v_product_id;
    END IF;

    IF v_product.stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product "%" (Requested: %, Available: %)',
        COALESCE(v_product.name, v_product_id), v_qty, v_product.stock;
    END IF;

    v_current_stock := v_product.stock;
    v_new_stock := v_current_stock - v_qty;

    UPDATE public.products
    SET stock = v_new_stock,
        in_stock = (v_new_stock > 0),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_product_id;

    -- Catalogue price, not v_item.price. This is the number the order is priced from.
    v_raw_subtotal := v_raw_subtotal + (GREATEST(v_product.price, 0) * v_qty);

    INSERT INTO public.inventory_logs (
      id, product_id, quantity_change, previous_stock, new_stock, type, reason
    ) VALUES (
      gen_random_uuid()::text,
      v_product_id,
      -v_qty,
      v_current_stock,
      v_new_stock,
      'SALE',
      'Order Placed: ' || p_order_id
    );
  END LOOP;

  -- Rounded once, after summing -- matching `Math.round(rawSubtotal)` in
  -- calculateOrderPricing rather than rounding each line.
  v_subtotal := round(v_raw_subtotal);

  -- 5. Coupon. Locked so the used_count increment cannot be lost, evaluated with the same
  --    rules as calculateOrderPricing, and never raising (D5).
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) != '' THEN
    SELECT to_jsonb(c) INTO v_coupon
    FROM public.coupons c
    WHERE UPPER(c.code) = UPPER(trim(p_coupon_code))
    FOR UPDATE;

    IF NOT FOUND THEN
      v_notes := v_notes || to_jsonb('coupon_not_found:' || trim(p_coupon_code));
    ELSE
      -- Every field via `->>`, so a column absent from this deployment reads as NULL
      -- rather than raising. See the declaration of v_coupon.
      v_coupon_id     := v_coupon ->> 'id';
      v_coupon_code   := COALESCE(v_coupon ->> 'code', trim(p_coupon_code));
      v_coupon_status := v_coupon ->> 'status';
      v_coupon_expiry := (v_coupon ->> 'expiry_date')::TIMESTAMPTZ;
      v_coupon_min    := (v_coupon ->> 'min_order_amount')::NUMERIC;
      v_coupon_type   := v_coupon ->> 'discount_type';
      v_coupon_value  := (v_coupon ->> 'discount_value')::NUMERIC;
      v_coupon_cap    := (v_coupon ->> 'max_discount_cap')::NUMERIC;
      v_coupon_limit  := (v_coupon ->> 'total_usage_limit')::INTEGER;
      v_coupon_used   := (v_coupon ->> 'used_count')::INTEGER;

      -- `!coupon.status || upper === 'ACTIVE'` and `!coupon.minOrderAmount` in the
      -- TypeScript engine: an empty status counts as active, and a minimum of 0 or NULL
      -- counts as no minimum.
      IF COALESCE(v_coupon_status, '') <> ''
         AND UPPER(v_coupon_status) <> 'ACTIVE' THEN
        v_notes := v_notes || to_jsonb('coupon_inactive:' || v_coupon_code);
      ELSIF v_coupon_expiry IS NOT NULL AND v_coupon_expiry < now() THEN
        v_notes := v_notes || to_jsonb('coupon_expired:' || v_coupon_code);
      ELSIF v_coupon_min IS NOT NULL
            AND v_coupon_min <> 0
            AND v_subtotal < v_coupon_min THEN
        v_notes := v_notes || to_jsonb('coupon_min_order_not_met:' || v_coupon_code);
      ELSIF v_subtotal > 0 THEN
        IF UPPER(COALESCE(v_coupon_type, 'PERCENTAGE')) IN ('PERCENTAGE', 'PERCENT') THEN
          v_discount := round((v_subtotal * COALESCE(v_coupon_value, 0)) / 100);
          -- `if (coupon.maxDiscountCap && ...)` -- a cap of 0 is falsy in JS, so 0 and
          -- NULL both mean uncapped. NULL is also what an absent column reads as, so a
          -- deployment without the column is uncapped here exactly as it is in the
          -- TypeScript engine today.
          IF v_coupon_cap IS NOT NULL
             AND v_coupon_cap <> 0
             AND v_discount > v_coupon_cap THEN
            v_discount := v_coupon_cap;
          END IF;
        ELSE
          v_discount := round(COALESCE(v_coupon_value, 0));
        END IF;

        v_discount := LEAST(v_subtotal, GREATEST(v_discount, 0));

        IF v_discount > 0 THEN
          v_coupon_applied := true;

          UPDATE public.coupons
          SET used_count = COALESCE(used_count, 0) + 1
          WHERE id = v_coupon_id;

          -- Reported, not enforced. See the header: the charge already ignored the limit,
          -- so refusing here would only destroy an order that was paid for.
          IF v_coupon_limit IS NOT NULL
             AND COALESCE(v_coupon_used, 0) >= v_coupon_limit THEN
            v_notes := v_notes || to_jsonb('coupon_usage_limit_exceeded:' || v_coupon_code);
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  -- 6. Remaining derivation, mirroring calculateOrderPricing step for step.
  v_taxable  := GREATEST(v_subtotal - v_discount, 0);
  v_shipping := CASE
                  WHEN v_subtotal >= c_free_ship_threshold OR v_subtotal = 0 THEN 0
                  ELSE c_standard_shipping
                END;
  v_gst      := round(v_taxable * c_gst_rate);
  v_total    := GREATEST(v_taxable + v_shipping + v_gst, 0);

  -- 7. Compare against what the caller supplied, and report rather than raise.
  --
  -- A mismatch has two causes and this function cannot tell them apart, so it records
  -- what it can prove and makes the difference visible. Either the caller sent figures
  -- that do not follow from the catalogue, or the catalogue changed between the handler
  -- pricing the cart and this transaction locking the rows -- an admin editing a price
  -- mid-checkout does exactly that. Raising would turn the second case into a captured
  -- payment with no order.
  IF COALESCE(p_subtotal, -1)      != v_subtotal
     OR COALESCE(p_discount, -1)      != v_discount
     OR COALESCE(p_shipping_cost, -1) != v_shipping
     OR COALESCE(p_gst, -1)           != v_gst
     OR COALESCE(p_total, -1)         != v_total THEN
    v_mismatch := true;
    v_supplied := jsonb_build_object(
      'subtotal', p_subtotal, 'discount', p_discount, 'shipping_cost', p_shipping_cost,
      'gst', p_gst, 'total', p_total
    );
    v_derived := jsonb_build_object(
      'subtotal', v_subtotal, 'discount', v_discount, 'shipping_cost', v_shipping,
      'gst', v_gst, 'total', v_total
    );
    RAISE WARNING 'ORDER_PRICING_MISMATCH order=% supplied=% derived=%',
      p_order_id, v_supplied, v_derived;
  END IF;

  v_customer_name := COALESCE(
    p_shipping_address->>'fullName',
    p_shipping_address->>'name',
    p_user_email,
    'Customer'
  );

  -- 8. Insert the order using the DERIVED figures. This is the fix for D1: the values
  --    below are computed above from locked catalogue and coupon rows, not received.
  INSERT INTO public.orders (
    id, user_id, customer_name, customer_email, user_email, phone, user_phone,
    subtotal, shipping_cost, discount, gst, total, total_amount,
    status, payment_method, payment_id, order_id, razorpay_signature,
    shipping_address, items, items_summary,
    created_at, updated_at
  ) VALUES (
    p_order_id, p_user_id, v_customer_name,
    COALESCE(p_user_email, 'customer@jassproducts.com'),
    p_user_email,
    COALESCE(p_user_phone, p_shipping_address->>'phone'),
    p_user_phone,
    v_subtotal, v_shipping, v_discount, v_gst, v_total, v_total,
    'PROCESSING',
    COALESCE(p_payment_method, 'PREPAID_ONLINE'),
    NULLIF(trim(COALESCE(p_payment_id, '')), ''),
    NULLIF(trim(COALESCE(p_razorpay_order_id, '')), ''),
    NULLIF(trim(COALESCE(p_razorpay_signature, '')), ''),
    COALESCE(p_shipping_address, '{}'::jsonb),
    p_items,
    (SELECT string_agg(i->>'name' || ' (x' || (i->>'qty') || ')', ', ') FROM jsonb_array_elements(p_items) AS i),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  );

  -- 9. Line items, priced from the catalogue rows locked in step 4 rather than from
  --    p_items. Those rows are locked for the life of this transaction, so the join
  --    cannot read a price other than the one the subtotal was derived from.
  FOR v_item IN
    SELECT t.id, t.qty, t.name, t.image, pr.price AS catalog_price
    FROM jsonb_to_recordset(p_items) AS t(id TEXT, qty INTEGER, name TEXT, price NUMERIC, image TEXT)
    JOIN public.products pr ON pr.id = t.id
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, product_name, quantity, unit_price, price, discount, subtotal, image_url, image
    ) VALUES (
      p_order_id,
      v_item.id,
      COALESCE(v_item.name, 'Product'),
      v_item.qty,
      GREATEST(COALESCE(v_item.catalog_price, 0), 0),
      GREATEST(COALESCE(v_item.catalog_price, 0), 0),
      0,
      GREATEST(COALESCE(v_item.catalog_price, 0), 0) * v_item.qty,
      v_item.image,
      v_item.image
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'total', v_total,
    'status', 'PROCESSING',
    'pricing', jsonb_build_object(
      'subtotal', v_subtotal, 'discount', v_discount, 'shipping_cost', v_shipping,
      'gst', v_gst, 'total', v_total, 'coupon_applied', v_coupon_applied
    ),
    'notes', v_notes
  ) || CASE
         WHEN v_mismatch THEN jsonb_build_object(
           'pricing_mismatch', jsonb_build_object('supplied', v_supplied, 'derived', v_derived)
         )
         ELSE '{}'::jsonb
       END;
END;
$$;


-- ---------------------------------------------------------------------
-- STEP 2b - Access list. Inside the SAME transaction, deliberately.
-- ---------------------------------------------------------------------
-- MEASURED, with these statements in a separate step after COMMIT:
--   grantee | privilege_type      has_function_privilege('anon', ..., 'EXECUTE')
--   PUBLIC  | EXECUTE                             t
-- A newly created function has EXECUTE granted to PUBLIC by default, so committing the
-- CREATE before revoking left the function callable by `anon` -- that is, by anyone holding
-- the publishable key that ships in the client bundle. Brief if both steps are run
-- back-to-back, permanent if an operator stops after STEP 2 or the revoke fails. Keeping
-- the revoke in the same transaction means the function is never visible with the default
-- access list.
--
-- Verified before writing this: no client code calls .rpc() at all -- the only two callers
-- in the repository are api/verify-razorpay-payment.ts:422 and api/cancel-order.ts:193,
-- both server-side. Removing `authenticated` removes D2 without removing a path the
-- application uses.
--
-- PREREQUISITE, and this one is load-bearing: api/verify-razorpay-payment.ts falls back to
-- VITE_SUPABASE_ANON_KEY when SUPABASE_SERVICE_ROLE_KEY is unset. On the anon key this RPC
-- is denied. MEASURED: the error is
--   SQLSTATE 42501  permission denied for function process_order_atomic
-- which contains neither "function public.process_order_atomic" nor "schema cache", so the
-- handler's fallback condition was false and it returned 409 without recording the order --
-- after the payment was captured. That is the state TODAY, because `anon` was already
-- revoked. The companion change to api/verify-razorpay-payment.ts classifies a denied or
-- missing RPC as "use the fallback" so this cannot lose an order; set
-- SUPABASE_SERVICE_ROLE_KEY in Vercel to get the atomic in-database path itself.
REVOKE EXECUTE ON FUNCTION public.process_order_atomic(
  TEXT, UUID, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB,
  TEXT, TEXT, TEXT, TEXT
) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_order_atomic(
  TEXT, UUID, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB,
  TEXT, TEXT, TEXT, TEXT
) TO service_role;

COMMIT;


-- ---------------------------------------------------------------------
-- STEP 3 - VERIFY. Re-run STEP 1a: exactly one signature should be listed, with
--          16 arguments, and can_execute should read only 'service_role' (plus the
--          function owner, which is expected).
-- ---------------------------------------------------------------------
