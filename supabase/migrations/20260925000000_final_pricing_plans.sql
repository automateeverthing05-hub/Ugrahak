-- =====================================================================
-- Ugrahak - Step 5 Migration: Final Pricing Plans & Default Free Tier
-- =====================================================================

-- 1. Alter merchants table default plan to 'FREE'
ALTER TABLE public.merchants
  ALTER COLUMN plan SET DEFAULT 'FREE';

-- 2. Ensure existing index on plan is present
CREATE INDEX IF NOT EXISTS idx_merchants_plan ON public.merchants(plan);

