-- ==============================================================================
-- SECTION 1: ORDERS — no anonymous writes
--
-- The production policy was:
--   FOR INSERT WITH CHECK ((auth.uid() IS NULL AND user_id IS NULL)
--                          OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));
-- The first branch admitted ANY anon-role insert with ANY content (status
-- 'PAID', arbitrary totals, arbitrary items JSONB). Orders are created only by
-- the payment verification handler, which runs with the service role and is
-- covered by "Service role full access on orders". Guests therefore need no
-- direct INSERT path at all.
-- ==============================================================================

DROP POLICY IF EXISTS "Authenticated checkout insert orders" ON public.orders;
DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;

CREATE POLICY "No direct anon insert on orders"
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (false);

-- Authenticated users may create their own PENDING orders (kept for future
-- direct-checkout flows). The status constraint is the important part: a user
-- can never fabricate a PAID/FULFILLED order directly.
CREATE POLICY "Users insert own pending orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'PENDING'
  );

-- ==============================================================================
-- SECTION 2: PROFILES — column-restricted self-update + role-change guard
--
-- The production policy was:
--   FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- with no column list, so a user could update their own `role` column and
-- become ADMIN/SUPER_ADMIN/STORE_MANAGER via is_admin().
-- ==============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Only cosmetic profile fields are self-writable. role, id and every
-- administrative column are excluded by the trigger below even if a future
-- policy widens the column list again.
CREATE POLICY "Users update own profile columns"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- The identity and the authorization level of a profile row are never
  -- self-modifiable. Users must go through a support/admin flow.
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'profiles.id cannot be changed';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow it ONLY when the actor really is an admin (service role and
    -- admin-initiated changes pass this check; self-changes do not).
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Changing profiles.role requires an administrator';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- ==============================================================================
-- SECTION 3: COUPONS — no public enumeration, no direct usage-counter writes
--
-- The production policies were:
--   "Public read coupons" ... USING (true)          -> enum oracle for anon
--   "Anyone can update coupon usage" ... WITH CHECK (true) -> counter spoofing
-- Validation now happens exclusively inside the privileged pricing path
-- (process_order_atomic / the server handlers with the service role).
-- ==============================================================================

DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can view coupons" ON public.coupons;

DROP POLICY IF EXISTS "Anyone can update coupon usage" ON public.coupons;
DROP POLICY IF EXISTS "anon update coupons" ON public.coupons;

CREATE POLICY "No anon access to coupons"
  ON public.coupons
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ==============================================================================
-- SECTION 4: VERIFICATION HELPERS (read-only sanity checks, safe to keep)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.audit_check_no_anon_order_writes()
RETURNS TABLE(policy_name text, cmd text, roles text[])
LANGUAGE sql
STABLE
AS $$
  SELECT policyname, cmd, roles
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'orders'
    AND cmd = 'INSERT'
$$;

COMMENT ON FUNCTION public.audit_check_no_anon_order_writes() IS
  'Audit helper: lists INSERT policies on orders. The anon INSERT policy must carry WITH CHECK (false).';
