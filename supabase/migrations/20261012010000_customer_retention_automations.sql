-- ==============================================================================
-- Migration: 20261012010000_customer_retention_automations.sql
-- Ugrahak SaaS - Customer Retention Automations:
-- 1. Automation 1: Google Review Invitation After 30 Minutes
-- 2. Automation 2: We Miss You After 30 Days of Inactivity
--
-- Additive only. Zero drops, zero deletes, zero truncates.
-- Preserves all existing tables, foreign keys, and RLS policies.
-- ==============================================================================

-- 1. Add Automation Settings to merchants table
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS is_review_request_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_reengagement_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reengagement_offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reengagement_message_template TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reengagement_cooldown_days INTEGER NOT NULL DEFAULT 30;

-- 2. Create inactive_customer_campaigns table for 30-day inactivity tracking
CREATE TABLE IF NOT EXISTS public.inactive_customer_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  last_qualifying_visit_at TIMESTAMPTZ NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Idempotency protection: Prevent duplicate campaigns for the exact same inactivity period
  CONSTRAINT uq_reengagement_cycle UNIQUE (merchant_id, customer_id, last_qualifying_visit_at)
);

-- 3. Composite indexes for high-speed queue polling and tenant isolation
CREATE INDEX IF NOT EXISTS idx_reengagement_merchant_status_sched
  ON public.inactive_customer_campaigns (merchant_id, status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_reengagement_status_sched
  ON public.inactive_customer_campaigns (status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_reengagement_customer_lookup
  ON public.inactive_customer_campaigns (customer_id);

-- 4. Enable Row Level Security (RLS) on inactive_customer_campaigns
ALTER TABLE public.inactive_customer_campaigns ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies for Merchants (Multi-Tenant Isolation)
DROP POLICY IF EXISTS "Merchants can view own reengagement campaigns" ON public.inactive_customer_campaigns;
CREATE POLICY "Merchants can view own reengagement campaigns"
  ON public.inactive_customer_campaigns
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update own reengagement campaigns" ON public.inactive_customer_campaigns;
CREATE POLICY "Merchants can update own reengagement campaigns"
  ON public.inactive_customer_campaigns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can delete own reengagement campaigns" ON public.inactive_customer_campaigns;
CREATE POLICY "Merchants can delete own reengagement campaigns"
  ON public.inactive_customer_campaigns
  FOR DELETE
  TO authenticated
  USING (auth.uid() = merchant_id);

-- 6. Trigger for updated_at on inactive_customer_campaigns
DROP TRIGGER IF EXISTS trigger_reengagement_updated_at ON public.inactive_customer_campaigns;
CREATE TRIGGER trigger_reengagement_updated_at
  BEFORE UPDATE ON public.inactive_customer_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

