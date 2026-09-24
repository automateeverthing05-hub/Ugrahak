-- ==============================================================================
-- ApnaGrahak - Complete Consolidated Database Schema & RLS Policies (Steps 1–5)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

-- 0. Helper function for updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. Merchants Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT NOT NULL,
  google_maps_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  plan TEXT NOT NULL DEFAULT 'TRIAL',
  subscription_status TEXT NOT NULL DEFAULT 'ACTIVE',
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchants_slug ON public.merchants(slug);
CREATE INDEX IF NOT EXISTS idx_merchants_plan ON public.merchants(plan);
CREATE INDEX IF NOT EXISTS idx_merchants_coords ON public.merchants(latitude, longitude);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own profile" ON public.merchants;
CREATE POLICY "Merchants can view own profile"
  ON public.merchants FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Merchants can insert own profile" ON public.merchants;
CREATE POLICY "Merchants can insert own profile"
  ON public.merchants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Merchants can update own profile" ON public.merchants;
CREATE POLICY "Merchants can update own profile"
  ON public.merchants FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public can read shop profile by slug" ON public.merchants;
CREATE POLICY "Public can read shop profile by slug"
  ON public.merchants FOR SELECT TO anon
  USING (true);

DROP TRIGGER IF EXISTS trigger_merchants_updated_at ON public.merchants;
CREATE TRIGGER trigger_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 2. Customers Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  visit_count INTEGER NOT NULL DEFAULT 1,
  first_visit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_merchant_customer_phone UNIQUE (merchant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_merchant_id ON public.customers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customers_merchant_phone ON public.customers(merchant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_merchant_created ON public.customers(merchant_id, created_at DESC);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own customers" ON public.customers;
CREATE POLICY "Merchants can view own customers"
  ON public.customers FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can insert own customers" ON public.customers;
CREATE POLICY "Merchants can insert own customers"
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update own customers" ON public.customers;
CREATE POLICY "Merchants can update own customers"
  ON public.customers FOR UPDATE TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON public.customers;
CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 3. Rewards Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL DEFAULT 'FIRST_VISIT',
  title TEXT NOT NULL,
  description TEXT,
  discount_value TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  reference_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_customer_reward_type UNIQUE (customer_id, reward_type)
);

CREATE INDEX IF NOT EXISTS idx_rewards_reference_code ON public.rewards(reference_code);
CREATE INDEX IF NOT EXISTS idx_rewards_merchant_id ON public.rewards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON public.rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_merchant_status ON public.rewards(merchant_id, status);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own rewards" ON public.rewards;
CREATE POLICY "Merchants can view own rewards"
  ON public.rewards FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update own rewards" ON public.rewards;
CREATE POLICY "Merchants can update own rewards"
  ON public.rewards FOR UPDATE TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

-- ------------------------------------------------------------------------------
-- 4. Customer Visits Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL DEFAULT 'FIRST_VISIT',
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_visits_merchant ON public.customer_visits(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_customer ON public.customer_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_time ON public.customer_visits(merchant_id, visited_at DESC);

ALTER TABLE public.customer_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own visits" ON public.customer_visits;
CREATE POLICY "Merchants can view own visits"
  ON public.customer_visits FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

-- ------------------------------------------------------------------------------
-- 5. Offers Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_merchant_id ON public.offers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_offers_merchant_status ON public.offers(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON public.offers(merchant_id, created_at DESC);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own offers" ON public.offers;
CREATE POLICY "Merchants can view own offers"
  ON public.offers FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can insert own offers" ON public.offers;
CREATE POLICY "Merchants can insert own offers"
  ON public.offers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update own offers" ON public.offers;
CREATE POLICY "Merchants can update own offers"
  ON public.offers FOR UPDATE TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can delete own offers" ON public.offers;
CREATE POLICY "Merchants can delete own offers"
  ON public.offers FOR DELETE TO authenticated
  USING (auth.uid() = merchant_id);

DROP TRIGGER IF EXISTS trigger_offers_updated_at ON public.offers;
CREATE TRIGGER trigger_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. Push Tokens Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'web',
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_merchant_customer_token UNIQUE (merchant_id, customer_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_merchant_id ON public.push_tokens(merchant_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_customer_id ON public.push_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_valid ON public.push_tokens(merchant_id, is_valid);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own push tokens" ON public.push_tokens;
CREATE POLICY "Merchants can view own push tokens"
  ON public.push_tokens FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

DROP TRIGGER IF EXISTS trigger_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER trigger_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. Notification Logs Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_merchant ON public.notification_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_offer ON public.notification_logs(offer_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_time ON public.notification_logs(merchant_id, sent_at DESC);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own notification logs" ON public.notification_logs;
CREATE POLICY "Merchants can view own notification logs"
  ON public.notification_logs FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

-- ------------------------------------------------------------------------------
-- 8. Nearby Offer Logs Table
-- ------------------------------------------------------------------------------
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

ALTER TABLE public.nearby_offer_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own nearby logs" ON public.nearby_offer_logs;
CREATE POLICY "Merchants can view own nearby logs"
  ON public.nearby_offer_logs FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

-- ------------------------------------------------------------------------------
-- 9. Scratch Card Rewards Table (Max 5 customizable rewards per merchant)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scratch_card_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  value TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scratch_rewards_merchant ON public.scratch_card_rewards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_scratch_rewards_enabled ON public.scratch_card_rewards(merchant_id, is_enabled);

ALTER TABLE public.scratch_card_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own scratch card rewards" ON public.scratch_card_rewards;
CREATE POLICY "Merchants can view own scratch card rewards"
  ON public.scratch_card_rewards FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can insert own scratch card rewards" ON public.scratch_card_rewards;
CREATE POLICY "Merchants can insert own scratch card rewards"
  ON public.scratch_card_rewards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update own scratch card rewards" ON public.scratch_card_rewards;
CREATE POLICY "Merchants can update own scratch card rewards"
  ON public.scratch_card_rewards FOR UPDATE TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can delete own scratch card rewards" ON public.scratch_card_rewards;
CREATE POLICY "Merchants can delete own scratch card rewards"
  ON public.scratch_card_rewards FOR DELETE TO authenticated
  USING (auth.uid() = merchant_id);

DROP TRIGGER IF EXISTS trigger_scratch_rewards_updated_at ON public.scratch_card_rewards;
CREATE TRIGGER trigger_scratch_rewards_updated_at
  BEFORE UPDATE ON public.scratch_card_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 10. Review Requests Table (Automatic 30-min Google Review Requests)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  review_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_review_req_merchant_customer UNIQUE (merchant_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_review_requests_merchant ON public.review_requests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status_time ON public.review_requests(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_review_requests_customer ON public.review_requests(customer_id);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own review requests" ON public.review_requests;
CREATE POLICY "Merchants can view own review requests"
  ON public.review_requests FOR SELECT TO authenticated
  USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update own review requests" ON public.review_requests;
CREATE POLICY "Merchants can update own review requests"
  ON public.review_requests FOR UPDATE TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

DROP TRIGGER IF EXISTS trigger_review_requests_updated_at ON public.review_requests;
CREATE TRIGGER trigger_review_requests_updated_at
  BEFORE UPDATE ON public.review_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 11. Scale & Performance Indexes (100k Merchants Scaling)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customers_merchant_visits ON public.customers(merchant_id, visit_count);
CREATE INDEX IF NOT EXISTS idx_customers_merchant_last_visit ON public.customers(merchant_id, last_visit_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_visits_customer_time ON public.customer_visits(customer_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_merchant_created ON public.rewards(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_customer_status ON public.rewards(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_push_tokens_customer_valid ON public.push_tokens(customer_id, is_valid);
CREATE INDEX IF NOT EXISTS idx_push_tokens_merchant_customer_valid ON public.push_tokens(merchant_id, customer_id, is_valid);
CREATE INDEX IF NOT EXISTS idx_notification_logs_customer_time ON public.notification_logs(customer_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_offer_status ON public.notification_logs(offer_id, status);
CREATE INDEX IF NOT EXISTS idx_review_requests_merchant_customer ON public.review_requests(merchant_id, customer_id);
