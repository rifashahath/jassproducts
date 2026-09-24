-- =====================================================================
-- P0-9 : One role vocabulary across the database and the application
-- =====================================================================
-- The set of strings that mean "administrator" was defined independently in five places
-- and they disagreed:
--
--   src/lib/roles.ts (new)             ADMIN_ROLES = SUPER_ADMIN, ADMIN, STORE_MANAGER
--   production_master_migration.sql    is_admin(): ADMIN, SUPER_ADMIN
--                                      admin_users checked with is_active + role filter
--   production_remediation_migration.sql
--   phase3_database_drift_and_atomicity.sql
--                                      is_admin(): ADMIN, SUPER_ADMIN
--                                      admin_users checked by user_id alone — no
--                                      is_active, no role — so a SUSPENDED admin or an
--                                      admin_users row of role 'STAFF' passed is_admin()
--   fix_registration_trigger_and_role_check.sql
--                                      profiles_role_check admits CUSTOMER/ADMIN/
--                                      SUPER_ADMIN/USER (+ lower case) — writing
--                                      'STORE_MANAGER' or 'STAFF' into profiles.role
--                                      violated the constraint outright
--   quickfix_admin_role.sql            is_admin() ALSO accepted
--                                      auth.jwt() -> 'user_metadata' ->> 'role' = 'ADMIN'
--                                      — user_metadata is client-writable through
--                                      supabase.auth.updateUser(), so that revision let
--                                      any signed-in user self-promote
--
-- The application side now shares src/lib/roles.ts (SUPER_ADMIN, ADMIN, STORE_MANAGER are
-- admin-class; STAFF is a real but non-admin role). This migration makes the database
-- agree with it, and restores the is_active/role conditions the later is_admin()
-- rewrites dropped. It is idempotent: every statement can be re-run.
-- =====================================================================

-- 1. admin_users: converge the schema. The remediation/phase3 definitions carry only
--    (user_id, role, created_at); production_master and the staff-management screen
--    (src/features/admin/users/store/admin-users-store.ts) write email, name,
--    permissions and is_active. Without these columns the store's insert fails.
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Rows created before is_active existed are active by definition (they were granting
-- admin unconditionally), so they keep granting it — nothing silently loses access.
UPDATE public.admin_users SET is_active = true WHERE is_active IS NULL;

-- 2. profiles.role: widen the CHECK to the full shared vocabulary. STORE_MANAGER and
--    STAFF are real roles the staff-management screen assigns; rejecting them at the
--    table level made every such write fail while the UI reported success.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'STORE_MANAGER', 'STAFF', 'USER',
    'customer', 'admin', 'user'
  ));

-- Rows already holding a legacy variant keep their meaning; normalise the casing so
-- UPPER()-based comparisons behave predictably.
UPDATE public.profiles SET role = UPPER(role) WHERE role IN ('customer', 'admin', 'user');

-- 3. The single is_admin(). Deliberately:
--      - app_metadata only, never user_metadata (client-writable — the hole the
--        quickfix revision introduced);
--      - admin_users rows must be is_active AND an admin-class role — suspending a
--        staff member from the console must actually revoke their privileges, and a
--        STAFF row in admin_users must not grant console access;
--      - profiles.role accepts the admin-class set, case-folded;
--      - returns false without a caller rather than erroring, so RLS policies that
--        reference it stay total.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Verified server-side app_metadata in the JWT (only service_role can set it)
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'SUPER_ADMIN', 'STORE_MANAGER') THEN
    RETURN true;
  END IF;

  -- 2. Dedicated admin_users registry — must be an active, admin-class row
  IF EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND is_active = true
      AND UPPER(COALESCE(role, 'ADMIN')) IN ('ADMIN', 'SUPER_ADMIN', 'STORE_MANAGER')
  ) THEN
    RETURN true;
  END IF;

  -- 3. profiles.role (writes protected by tr_protect_profile_role)
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF UPPER(COALESCE(v_role, '')) IN ('ADMIN', 'SUPER_ADMIN', 'STORE_MANAGER') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO public, anon, authenticated, service_role;

-- 4. protect_profile_role_update: keep guarding role writes, judged by the same
--    vocabulary (an admin-class caller may re-assign roles; nobody else may).
CREATE OR REPLACE FUNCTION public.protect_profile_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only Supabase service_role or a verified admin-class caller can modify the role column
    IF auth.role() != 'service_role' AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: Modifying user role is restricted to administrators.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role_update();
