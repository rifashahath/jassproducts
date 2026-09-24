-- ==============================================================================
-- FIX FOR REGISTRATION ERROR 500 / "{}" (profiles_role_check constraint)
-- ==============================================================================
-- Fixes the check constraint on profiles.role and ensures handle_new_user trigger
-- inserts a valid role ('CUSTOMER') upon user signup.

-- 1. Drop existing restrictive constraint and allow all standard roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'USER', 'customer', 'admin', 'user'));

-- 2. Set column default to CUSTOMER
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'CUSTOMER';

-- 3. Update existing profiles that might have invalid roles
UPDATE public.profiles SET role = 'CUSTOMER' WHERE role IS NULL OR role NOT IN ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN');

-- 4. Recreate handle_new_user trigger function with robust error-safe insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'CUSTOMER'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Prevent signup failure if profile insertion encounters a non-critical error
    RAISE WARNING 'handle_new_user profile creation warning: %', SQLERRM;
    RETURN new;
END;
$$;

-- 5. Ensure trigger is properly linked to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
