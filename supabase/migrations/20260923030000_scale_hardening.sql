-- ==============================================================================
-- Migration: 20260923030000_scale_hardening.sql
-- Goal: Fix Step 3 bottlenecks:
-- 1. Denormalized customer_count on merchants table + atomic maintenance trigger
-- 2. Backfill existing customer counts safely
-- 3. Composite coordinates index for bounding-box nearby radar queries
-- 4. Case-insensitive slug index for instant public storefront lookups
-- Additive only. Zero drops, zero deletes, zero truncates.
-- ==============================================================================

-- 1. Add customer_count column to merchants
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS customer_count INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill existing customer counts safely for all merchants
UPDATE public.merchants m
SET customer_count = COALESCE((
    SELECT COUNT(*)
    FROM public.customers c
    WHERE c.merchant_id = m.id
), 0);

-- 3. Atomic Trigger Function for real-time customer count sync
CREATE OR REPLACE FUNCTION public.update_merchant_customer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.merchants
        SET customer_count = customer_count + 1
        WHERE id = NEW.merchant_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.merchants
        SET customer_count = GREATEST(0, customer_count - 1)
        WHERE id = OLD.merchant_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_customer_count ON public.customers;
CREATE TRIGGER trg_customer_count
AFTER INSERT OR DELETE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_merchant_customer_count();

-- 4. Fast Spatial & Storefront Indexes
CREATE INDEX IF NOT EXISTS idx_merchants_coords
ON public.merchants (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_merchants_slug_lower
ON public.merchants (LOWER(slug));

CREATE INDEX IF NOT EXISTS idx_offers_merchant_active_created
ON public.offers (merchant_id, status, created_at DESC);

