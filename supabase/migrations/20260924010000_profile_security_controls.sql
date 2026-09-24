-- ==============================================================================
-- Protect profile security-control fields from self-service updates.
-- The prior RLS policy correctly restricted the row to its owner but did not
-- restrict columns. Keep the policy row-scoped, and enforce the sensitive-field
-- boundary in a trigger so future policy changes cannot silently widen it.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'profiles.id cannot be changed';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Changing profiles.role requires an administrator';
  END IF;

  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Changing profiles.is_blocked requires an administrator';
  END IF;

  IF NEW.block_reason IS DISTINCT FROM OLD.block_reason
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Changing profiles.block_reason requires an administrator';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

COMMENT ON FUNCTION public.prevent_profile_privilege_escalation() IS
  'Prevents self-service changes to identity, role, and account-blocking fields.';
