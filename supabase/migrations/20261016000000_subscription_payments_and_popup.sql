-- ==============================================================================
-- Migration: 20261016000000_subscription_payments_and_popup.sql
-- Goal:
-- 1. Add last_upgrade_popup_date column to merchants for cross-device daily popup tracking.
-- 2. Create public.payments ledger table with RLS, idempotency, and audit fields.
-- 3. Extend enforce_merchant_plan_protection trigger to allow last_upgrade_popup_date updates.
-- ==============================================================================

-- NOT executed on any live database. Written for review and future deployment only.

-- -------------------------------------------------------------------------
-- 1. Add last_upgrade_popup_date column to merchants
--    Tracks the local calendar date (IST YYYY-MM-DD) when the upgrade popup
--    was last shown, for cross-device once-per-day enforcement.
-- -------------------------------------------------------------------------
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS last_upgrade_popup_date DATE;

-- -------------------------------------------------------------------------
-- 2. Create payments ledger table
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,          -- Populated after capture; NULL until then
  plan TEXT NOT NULL CHECK (plan IN ('STARTER', 'GROWTH', 'PRO')),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'CREATED'
    CHECK (status IN ('CREATED', 'CAPTURED', 'FAILED', 'REFUNDED')),
  raw_payload JSONB,                 -- Razorpay webhook body for audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on payment_id to prevent duplicate webhook processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_payment_id
  ON public.payments(razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

-- Index for per-merchant payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_merchant_id
  ON public.payments(merchant_id, created_at DESC);

-- Index for order lookups (idempotency)
CREATE INDEX IF NOT EXISTS idx_payments_order_id
  ON public.payments(razorpay_order_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_payments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_payments_updated_at();

-- -------------------------------------------------------------------------
-- 3. RLS on payments
-- -------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Merchants can read their own payment history (read-only)
CREATE POLICY "Merchants can view own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

-- Deny direct INSERT / UPDATE / DELETE from client roles
-- Only service_role backend may create or update payment records
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.payments TO service_role;
GRANT SELECT ON public.payments TO authenticated;

-- -------------------------------------------------------------------------
-- 4. Update enforce_merchant_plan_protection trigger
--    Allow merchants to update last_upgrade_popup_date (harmless UX preference)
--    while continuing to block plan, subscription, and customer_count changes.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_merchant_plan_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Service role and postgres super user bypass all checks
    IF (auth.jwt() ->> 'role') = 'service_role' OR current_user = 'postgres' THEN
        RETURN NEW;
    END IF;

    -- Block direct plan changes
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot change plan directly. Use the billing upgrade flow.';
    END IF;

    IF NEW.customer_count IS DISTINCT FROM OLD.customer_count THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot modify customer_count directly.';
    END IF;

    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot modify subscription_status directly.';
    END IF;

    IF NEW.subscription_started_at IS DISTINCT FROM OLD.subscription_started_at THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot modify subscription_started_at.';
    END IF;

    IF NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot modify trial_started_at.';
    END IF;

    IF NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at THEN
        RAISE EXCEPTION 'Unauthorized: Merchant cannot modify trial_ends_at.';
    END IF;

    -- last_upgrade_popup_date is explicitly permitted (harmless UX preference)
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_merchant_plan_protection ON public.merchants;
CREATE TRIGGER trg_enforce_merchant_plan_protection
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_merchant_plan_protection();

