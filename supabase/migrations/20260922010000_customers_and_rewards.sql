-- =======================================================
-- ApnaGrahak - Step 2 Migration: Customers, Rewards & Visits
-- =======================================================

-- 1. Customers Table
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

-- Indexes for customer queries
CREATE INDEX IF NOT EXISTS idx_customers_merchant_id ON public.customers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customers_merchant_phone ON public.customers(merchant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_merchant_created ON public.customers(merchant_id, created_at DESC);

-- Enable RLS on Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own customers"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert own customers"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update own customers"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

-- Trigger for customer updated_at
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON public.customers;
CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Rewards Table
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

-- Indexes for rewards
CREATE INDEX IF NOT EXISTS idx_rewards_reference_code ON public.rewards(reference_code);
CREATE INDEX IF NOT EXISTS idx_rewards_merchant_id ON public.rewards(merchant_id);
CREATE INDEX IF NOT EXISTS idx_rewards_customer_id ON public.rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_merchant_status ON public.rewards(merchant_id, status);

-- Enable RLS on Rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own rewards"
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update own rewards"
  ON public.rewards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

-- 3. Customer Visits Table
CREATE TABLE IF NOT EXISTS public.customer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL DEFAULT 'FIRST_VISIT',
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for visits
CREATE INDEX IF NOT EXISTS idx_customer_visits_merchant ON public.customer_visits(merchant_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_customer ON public.customer_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_visits_time ON public.customer_visits(merchant_id, visited_at DESC);

-- Enable RLS on Visits
ALTER TABLE public.customer_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own visits"
  ON public.customer_visits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

