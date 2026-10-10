-- Migration: Setup Supabase Storage for Offer & Product Images
-- Allows authenticated merchants to upload their offer/product images into isolated paths: {merchant_id}/*
-- Allows public read access for customers viewing offers, notifications, and storefront deals.

-- 1. Create 'offers' bucket if not already existing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offers',
  'offers',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 2. Storage RLS Policies for 'offers' bucket
-- Public read access for customers and public storefront
CREATE POLICY "Public Read Offers Bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'offers');

-- Merchant upload access: Must be authenticated and upload strictly into their own folder {auth.uid()}/*
CREATE POLICY "Merchant Upload Offers Images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'offers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Merchant update access: Strictly their own images
CREATE POLICY "Merchant Update Offers Images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'offers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'offers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Merchant delete access: Strictly their own images
CREATE POLICY "Merchant Delete Offers Images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'offers' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

