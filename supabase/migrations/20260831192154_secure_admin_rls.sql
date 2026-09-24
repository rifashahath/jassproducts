-- ==============================================================================
-- SECURE ROW LEVEL SECURITY FOR ADMIN USERS
-- ==============================================================================
-- Enforces strict access control on the admin_users table to prevent unprivileged
-- users from granting themselves admin access or altering existing admins.

-- 1. Enable RLS on the table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.admin_users;
DROP POLICY IF EXISTS "Allow all insert" ON public.admin_users;
DROP POLICY IF EXISTS "Allow all update" ON public.admin_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.admin_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can view all" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can delete" ON public.admin_users;

-- 3. Define secure policies

-- View Policy: Only authenticated users with the ADMIN role can view the admin_users table
CREATE POLICY "Admins can view admin_users" ON public.admin_users
FOR SELECT TO authenticated
USING ( (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'ADMIN' );

-- Insert Policy: Only authenticated users with the ADMIN role can insert new admins
CREATE POLICY "Admins can insert admin_users" ON public.admin_users
FOR INSERT TO authenticated
WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'ADMIN' );

-- Update Policy: Only authenticated users with the ADMIN role can update admins
CREATE POLICY "Admins can update admin_users" ON public.admin_users
FOR UPDATE TO authenticated
USING ( (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'ADMIN' )
WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'ADMIN' );

-- Delete Policy: Only authenticated users with the ADMIN role can delete admins
CREATE POLICY "Admins can delete admin_users" ON public.admin_users
FOR DELETE TO authenticated
USING ( (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'ADMIN' );
