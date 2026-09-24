-- =================================================================
-- ApnaGrahak - Step 3 Migration: Offers, Push Tokens & Notification Logs
-- =================================================================

-- 1. Offers Table
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

CREATE POLICY "Merchants can view own offers"
  ON public.offers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert own offers"
  ON public.offers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update own offers"
  ON public.offers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can delete own offers"
  ON public.offers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = merchant_id);

-- Trigger for offer updated_at
DROP TRIGGER IF EXISTS trigger_offers_updated_at ON public.offers;
CREATE TRIGGER trigger_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Push Tokens Table
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

CREATE POLICY "Merchants can view own push tokens"
  ON public.push_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

-- Trigger for push_tokens updated_at
DROP TRIGGER IF EXISTS trigger_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER trigger_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Notification Logs Table
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  status TEXT NOT NULL, -- 'SENT' | 'FAILED' | 'INVALID_TOKEN'
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_merchant ON public.notification_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_offer ON public.notification_logs(offer_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_time ON public.notification_logs(merchant_id, sent_at DESC);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own notification logs"
  ON public.notification_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = merchant_id);

