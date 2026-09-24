-- =======================================================
-- ApnaGrahak - Step 1 Migration: Merchant Profile & RLS
-- =======================================================

-- Create merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT NOT NULL,
  google_maps_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast slug lookups on public shop pages
CREATE INDEX IF NOT EXISTS idx_merchants_slug ON public.merchants(slug);

-- Enable Row Level Security (RLS)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- 1. Authenticated merchants can view only their own record
CREATE POLICY "Merchants can view own profile"
  ON public.merchants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Authenticated merchants can insert their own record
CREATE POLICY "Merchants can insert own profile"
  ON public.merchants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Authenticated merchants can update their own record
CREATE POLICY "Merchants can update own profile"
  ON public.merchants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Public shop lookups (read-only for shop display)
-- Note: Sensitive fields can be restricted at query level
CREATE POLICY "Public can read shop profile by slug"
  ON public.merchants
  FOR SELECT
  TO anon
  USING (true);

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_merchants_updated_at ON public.merchants;
CREATE TRIGGER trigger_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

