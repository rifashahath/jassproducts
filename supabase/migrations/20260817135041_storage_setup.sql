-- ============================================================
-- Supabase Storage Setup Script: 'images' bucket & Secure Admin RLS policies
-- ============================================================

-- 1. Create public storage bucket for product images and logos
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('images', 'images', true, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

-- Drop legacy storage policies
DROP POLICY IF EXISTS "Public Read Access for Images Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access for Images Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access for Images Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Access for Images Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access for Images Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access for Images Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access for Images Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access for Images Bucket" ON storage.objects;

-- 2. Allow public read access to images bucket
CREATE POLICY "Public Read Access for Images Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- 3. Restrict upload strictly to Administrators
CREATE POLICY "Admin Upload Access for Images Bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images' AND public.is_admin());

-- 4. Restrict update strictly to Administrators
CREATE POLICY "Admin Update Access for Images Bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND public.is_admin());

-- 5. Restrict delete strictly to Administrators
CREATE POLICY "Admin Delete Access for Images Bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND public.is_admin());
