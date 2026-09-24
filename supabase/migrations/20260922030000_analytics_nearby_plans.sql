-- =====================================================================
-- ApnaGrahak - Step 4 Migration: Coordinates, Plans & Nearby Offer Logs
-- =====================================================================

-- 1. Alter merchants table to support coordinates & subscription plans
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Index on merchant plan and coordinates
CREATE INDEX IF NOT EXISTS idx_merchants_plan ON public.merchants(plan);
CREATE INDEX IF NOT EXISTS idx_merchants_coords ON public.merchants(latitude, longitude);

-- 2. Nearby Offer Logs Table (for 24-hour rate limiting & audit history)
CREATE TABLE IF NOT EXISTS public.nearby_offer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  distance_meters DOUBLE PRECISION,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nearby_logs_rate_limit 
  ON public.nearby_offer_logs(merchant_id, customer_id, triggered_at DESC);

-- Enable RLS on nearby_offer_logs
ALTER TABLE public.nearby_offer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own nearby logs"
  ON public.nearby_offer_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

